import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runMockOrchestrator } from '@/lib/ai/assistant/orchestrator';

const MESSAGE_HARD_CAP = 20;
const STREAMING_DELAY_MS = 30;

const bodySchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z.string().min(1).max(4000),
});

function sse(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentOrg();
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    const { message } = parsed.data;
    let conversationId = parsed.data.conversationId;

    // Create conversation if none provided
    if (!conversationId) {
      const conv = await db.aiAssistantConversation.create({
        data: {
          organizationId: session.orgId,
          userId: session.userId,
          title: message.slice(0, 80),
        },
      });
      conversationId = conv.id;
    } else {
      // Verify ownership
      const conv = await db.aiAssistantConversation.findFirst({
        where: { id: conversationId, organizationId: session.orgId },
        select: { id: true },
      });
      if (!conv) {
        return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      }
    }

    // Enforce message cap
    const msgCount = await db.aiAssistantMessage.count({ where: { conversationId } });
    if (msgCount >= MESSAGE_HARD_CAP) {
      return NextResponse.json(
        { error: 'Conversation limit reached (20 messages). Start a new chat.' },
        { status: 429 },
      );
    }

    // Persist user message
    await db.aiAssistantMessage.create({
      data: {
        organizationId: session.orgId,
        conversationId,
        role: 'USER',
        content: message,
      },
    });

    // Run orchestrator (keyword matcher → real DB tools)
    const { text, toolCalls } = await runMockOrchestrator(message, session.orgId);

    // Persist assistant message
    await db.aiAssistantMessage.create({
      data: {
        organizationId: session.orgId,
        conversationId,
        role: 'ASSISTANT',
        content: text,
        toolCalls: toolCalls as never,
        tokensUsed: 0,
      },
    });

    // Update conversation timestamp
    await db.aiAssistantConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    logger.info({ conversationId, toolCount: toolCalls.length }, 'assistant:response');

    // Stream response as SSE
    const words = text.split(' ');
    const convId = conversationId;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(sse({ type: 'meta', conversationId: convId, toolCalls }));

        for (const word of words) {
          await new Promise<void>((r) => setTimeout(r, STREAMING_DELAY_MS));
          controller.enqueue(sse({ type: 'chunk', text: word + ' ' }));
        }

        controller.enqueue(sse({ type: 'done' }));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Conversation-Id': convId,
      },
    });
  } catch (err) {
    logger.error({ err }, 'assistant:error');
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
