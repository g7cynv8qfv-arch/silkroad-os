'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  Bot,
  Send,
  Plus,
  ChevronRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  listConversations,
  getConversation,
  deleteConversation,
} from '@/features/assistant/actions';
import {
  type ConversationSummary,
  type AssistantMessage,
  type ToolCallRecord,
  type StreamEvent,
} from '@/features/assistant/types';

// ── Markdown renderer (no external deps) ──────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
  const segments = React.useMemo(() => parseMarkdown(text), [text]);
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === 'bold') return <strong key={i}>{seg.content}</strong>;
        if (seg.type === 'code')
          return (
            <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">
              {seg.content}
            </code>
          );
        if (seg.type === 'break') return <br key={i} />;
        return <React.Fragment key={i}>{seg.content}</React.Fragment>;
      })}
    </span>
  );
}

type Segment = { type: 'text' | 'bold' | 'code' | 'break'; content: string };

function parseMarkdown(text: string): Segment[] {
  const segments: Segment[] = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) segments.push({ type: 'break', content: '' });

    const boldCodeRegex = /\*\*(.+?)\*\*|`(.+?)`/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = boldCodeRegex.exec(line)) !== null) {
      if (match.index > last) {
        segments.push({ type: 'text', content: line.slice(last, match.index) });
      }
      if (match[1] !== undefined) {
        segments.push({ type: 'bold', content: match[1] });
      } else if (match[2] !== undefined) {
        segments.push({ type: 'code', content: match[2] });
      }
      last = match.index + match[0].length;
    }
    if (last < line.length) {
      segments.push({ type: 'text', content: line.slice(last) });
    }
  });

  return segments;
}

// ── Tool calls panel ──────────────────────────────────────────────────────────

function ToolCallsPanel({ toolCalls }: { toolCalls: ToolCallRecord[] }) {
  const [open, setOpen] = React.useState(false);
  if (toolCalls.length === 0) return null;

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Used {toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {toolCalls.map((tc, i) => (
            <div
              key={i}
              className="rounded border border-border/60 bg-surface-2/50 px-2 py-1.5 font-mono text-[10px] text-muted-foreground"
            >
              <span className="font-semibold text-accent">{tc.name}</span>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(tc.result, null, 2).slice(0, 400)}
                {JSON.stringify(tc.result, null, 2).length > 400 ? '\n…' : ''}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, streaming }: { message: AssistantMessage; streaming?: boolean }) {
  const isUser = message.role === 'USER';
  const toolCalls = message.toolCalls ?? [];

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-accent text-accent-foreground'
            : 'rounded-bl-sm bg-surface-2 text-foreground',
        )}
      >
        {isUser ? message.content : <MarkdownText text={message.content} />}
        {streaming && (
          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" />
        )}
      </div>
      {!isUser && <ToolCallsPanel toolCalls={toolCalls} />}
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────

function SuggestedPrompts({
  onSelect,
  t,
}: {
  onSelect: (prompt: string) => void;
  t: ReturnType<typeof useTranslations<'assistant'>>;
}) {
  const suggestions = [
    t('suggestions.riskiestSupplier'),
    t('suggestions.revenueThisMonth'),
    t('suggestions.lateOrders'),
    t('suggestions.recentInvoices'),
  ] as const;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
        <Bot className="h-6 w-6 text-accent" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{t('empty.title')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('empty.description')}</p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={cn(
              'flex items-center justify-between rounded-xl border border-border/60 bg-surface-1',
              'px-4 py-3 text-left text-sm text-muted-foreground',
              'transition-colors hover:border-accent/40 hover:bg-surface-2 hover:text-foreground',
            )}
          >
            {s}
            <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Conversation list ─────────────────────────────────────────────────────────

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  t,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations<'assistant'>>;
}) {
  return (
    <div className="flex h-full flex-col">
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('historyTitle')}
      </p>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">{t('noHistory')}</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group relative flex cursor-pointer items-start gap-2 px-3 py-2.5 text-xs',
                'transition-colors hover:bg-surface-2',
                activeId === conv.id && 'bg-accent/10 text-accent',
              )}
              onClick={() => onSelect(conv.id)}
            >
              <span
                className={cn(
                  'flex-1 truncate leading-snug',
                  activeId === conv.id
                    ? 'text-accent'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              >
                {conv.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="shrink-0 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main AssistantSheet ───────────────────────────────────────────────────────

export function AssistantSheet() {
  const t = useTranslations('assistant');

  const [open, setOpen] = React.useState(false);
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState<AssistantMessage | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ⌘J shortcut
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Load conversations when sheet opens
  React.useEffect(() => {
    if (!open) return;
    listConversations()
      .then(setConversations)
      .catch(() => null);
  }, [open]);

  // Auto-scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage?.content]);

  async function loadConversation(id: string) {
    setActiveConvId(id);
    setStreamingMessage(null);
    const conv = await getConversation(id);
    if (conv) setMessages(conv.messages);
  }

  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setStreamingMessage(null);
    setInput('');
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) startNewChat();
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setInput('');
    setError(null);

    // Optimistically add user message
    const userMsg: AssistantMessage = {
      id: `optimistic-${Date.now()}`,
      role: 'USER',
      content: trimmed,
      toolCalls: null,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const streamingPlaceholder: AssistantMessage = {
      id: `streaming-${Date.now()}`,
      role: 'ASSISTANT',
      content: '',
      toolCalls: null,
      createdAt: new Date(),
    };
    setStreamingMessage(streamingPlaceholder);
    setIsStreaming(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId ?? undefined, message: trimmed }),
      });

      if (!res.ok) {
        const { error: errMsg } = (await res.json()) as { error: string };
        throw new Error(errMsg ?? 'Request failed');
      }

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';
      let finalToolCalls: ToolCallRecord[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event = JSON.parse(line.slice(6)) as StreamEvent;

          if (event.type === 'meta') {
            setActiveConvId(event.conversationId);
            finalToolCalls = event.toolCalls;
            // Add to conversations list if new
            setConversations((prev) => {
              const exists = prev.find((c) => c.id === event.conversationId);
              if (exists) return prev;
              return [
                {
                  id: event.conversationId,
                  title: trimmed.slice(0, 80),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                ...prev,
              ];
            });
          } else if (event.type === 'chunk') {
            finalContent += event.text;
            setStreamingMessage((prev) =>
              prev ? { ...prev, content: finalContent, toolCalls: finalToolCalls } : prev,
            );
          } else if (event.type === 'done') {
            // Finalize: move streaming message to real messages
            const finalMsg: AssistantMessage = {
              id: `final-${Date.now()}`,
              role: 'ASSISTANT',
              content: finalContent.trim(),
              toolCalls: finalToolCalls.length > 0 ? finalToolCalls : null,
              createdAt: new Date(),
            };
            setMessages((prev) => [...prev, finalMsg]);
            setStreamingMessage(null);
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t('error');
      setError(errMsg);
      setStreamingMessage(null);
    } finally {
      setIsStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const hasMessages = messages.length > 0 || streamingMessage !== null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t('title')}
        className={cn(
          'fixed bottom-6 right-6 z-40',
          'flex h-12 w-12 items-center justify-center rounded-2xl',
          'bg-accent text-accent-foreground shadow-lg shadow-accent/30',
          'transition-transform hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        )}
      >
        <Bot className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          hideClose
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <SheetTitle className="text-sm font-semibold">{t('title')}</SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={startNewChat}
                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('newChat')}
              </Button>
              <SheetClose asChild>
                <button
                  className={cn(
                    'ml-1 rounded-md p-1 text-muted-foreground',
                    'transition-colors hover:bg-surface-2 hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                  )}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </SheetClose>
            </div>
          </div>

          {/* Body: history + chat */}
          <div className="flex flex-1 overflow-hidden">
            {/* History sidebar */}
            <div className="w-36 shrink-0 overflow-hidden border-r border-border">
              <ConversationList
                conversations={conversations}
                activeId={activeConvId}
                onSelect={loadConversation}
                onDelete={handleDelete}
                t={t}
              />
            </div>

            {/* Chat area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {!hasMessages ? (
                  <SuggestedPrompts onSelect={(s) => sendMessage(s)} t={t} />
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {streamingMessage && <MessageBubble message={streamingMessage} streaming />}
                    {isStreaming && !streamingMessage?.content && (
                      <div className="flex items-start">
                        <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-surface-2 px-3.5 py-2.5 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Thinking…
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Error banner */}
              {error && (
                <div className="mx-4 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 transition-all focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={t('placeholder')}
                    disabled={isStreaming}
                    rows={1}
                    className={cn(
                      'flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none',
                      'focus-visible:ring-0 focus-visible:ring-offset-0',
                      'placeholder:text-muted-foreground/60',
                      'max-h-[120px] min-h-[20px]',
                    )}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isStreaming}
                    className="h-7 w-7 shrink-0 rounded-lg"
                    aria-label={t('send')}
                  >
                    {isStreaming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
