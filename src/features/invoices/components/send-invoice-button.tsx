'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendInvoice } from '../actions';

interface SendInvoiceButtonProps {
  invoiceId: string;
  status: string;
  clientEmail: string | null;
}

export function SendInvoiceButton({ invoiceId, status, clientEmail }: SendInvoiceButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const canSend = ['DRAFT', 'SENT'].includes(status);
  if (!canSend) return null;

  async function handleSend() {
    if (!clientEmail) {
      toast.error('Client has no email address. Add one in the client settings.');
      return;
    }
    setIsPending(true);
    try {
      const result = await sendInvoice(invoiceId);
      if (result.success) {
        toast.success(status === 'SENT' ? 'Invoice resent' : 'Invoice sent successfully');
      } else {
        toast.error(result.error ?? 'Failed to send invoice');
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      onClick={handleSend}
      disabled={isPending}
      variant={status === 'SENT' ? 'outline' : 'primary'}
    >
      <Send className="h-4 w-4" />
      {isPending ? 'Sending…' : status === 'SENT' ? 'Resend' : 'Send invoice'}
    </Button>
  );
}
