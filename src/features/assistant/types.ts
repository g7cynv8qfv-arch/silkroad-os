import { type ToolCallRecord } from '@/lib/ai/assistant/orchestrator';

export type { ToolCallRecord };

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  toolCalls: ToolCallRecord[] | null;
  createdAt: Date;
}

export interface ConversationDetail extends ConversationSummary {
  messages: AssistantMessage[];
}

export type StreamEvent =
  | { type: 'meta'; conversationId: string; toolCalls: ToolCallRecord[] }
  | { type: 'chunk'; text: string }
  | { type: 'done' };
