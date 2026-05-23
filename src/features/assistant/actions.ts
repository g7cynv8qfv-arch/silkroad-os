'use server';

import { getCurrentOrg } from '@/lib/auth';
import { db } from '@/lib/db';
import { type ConversationSummary, type ConversationDetail, type AssistantMessage } from './types';

export async function listConversations(): Promise<ConversationSummary[]> {
  const { orgId, userId } = await getCurrentOrg();
  return db.aiAssistantConversation.findMany({
    where: { organizationId: orgId, userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const { orgId } = await getCurrentOrg();
  const conv = await db.aiAssistantConversation.findFirst({
    where: { id, organizationId: orgId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          toolCalls: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conv) return null;

  return {
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messages: conv.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolCalls: (m.toolCalls as AssistantMessage['toolCalls']) ?? null,
      createdAt: m.createdAt,
    })),
  };
}

export async function deleteConversation(id: string): Promise<void> {
  const { orgId } = await getCurrentOrg();
  await db.aiAssistantConversation.deleteMany({
    where: { id, organizationId: orgId },
  });
}
