'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, MailCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateInvoiceStatus } from '../actions';
import { INVOICE_STATUS_TRANSITIONS } from '../schemas';
import type { InvoiceStatus } from '../schemas';

const TRANSITION_CONFIG: Record<
  InvoiceStatus,
  { label: string; icon: React.ReactNode; destructive?: boolean }
> = {
  DRAFT: {
    label: 'Mark as draft',
    icon: <Clock className="h-4 w-4" />,
  },
  SENT: {
    label: 'Mark as sent',
    icon: <MailCheck className="h-4 w-4" />,
  },
  PAID: {
    label: 'Mark as paid',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  OVERDUE: {
    label: 'Mark as overdue',
    icon: <Clock className="h-4 w-4" />,
  },
  CANCELLED: {
    label: 'Cancel invoice',
    icon: <XCircle className="h-4 w-4" />,
    destructive: true,
  },
};

interface ChangeStatusButtonProps {
  invoiceId: string;
  status: InvoiceStatus;
}

export function ChangeStatusButton({ invoiceId, status }: ChangeStatusButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const validTransitions = (INVOICE_STATUS_TRANSITIONS[status] ?? []) as InvoiceStatus[];
  if (validTransitions.length === 0) return null;

  const nonDestructive = validTransitions.filter((s) => !TRANSITION_CONFIG[s]?.destructive);
  const destructive = validTransitions.filter((s) => TRANSITION_CONFIG[s]?.destructive);

  async function handleTransition(target: InvoiceStatus) {
    setIsPending(true);
    try {
      const result = await updateInvoiceStatus(invoiceId, target);
      if (result.success) {
        toast.success(
          `Status updated to ${TRANSITION_CONFIG[target]?.label.replace('Mark as ', '') ?? target.toLowerCase()}`,
        );
      } else {
        toast.error(result.error ?? 'Failed to update status');
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          {isPending ? 'Updating…' : 'Change status'}
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {nonDestructive.map((target) => {
          const cfg = TRANSITION_CONFIG[target];
          return (
            <DropdownMenuItem
              key={target}
              onClick={() => handleTransition(target)}
              className="gap-2"
            >
              {cfg?.icon}
              {cfg?.label}
            </DropdownMenuItem>
          );
        })}
        {destructive.length > 0 && nonDestructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map((target) => {
          const cfg = TRANSITION_CONFIG[target];
          return (
            <DropdownMenuItem
              key={target}
              onClick={() => handleTransition(target)}
              className="gap-2 text-danger focus:text-danger"
            >
              {cfg?.icon}
              {cfg?.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
