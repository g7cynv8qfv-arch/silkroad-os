'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { recordPayment } from '../actions';
import { CURRENCIES } from '@/lib/currency';
import { centsToDisplay, parseCurrencyInput } from '@/lib/currency';

const formSchema = z.object({
  amountDisplay: z.string().min(1, 'Required'),
  currency: z.enum(CURRENCIES),
  method: z.enum(['WIRE_TRANSFER', 'PAYPAL', 'CREDIT_CARD', 'CRYPTO', 'OTHER']),
  paidAt: z.string().min(1, 'Required'),
  reference: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const METHODS = [
  { value: 'WIRE_TRANSFER', label: 'Wire transfer' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'CREDIT_CARD', label: 'Credit card' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'OTHER', label: 'Other' },
];

interface RecordPaymentDialogProps {
  invoiceId: string;
  currency: string;
  remainingCents: number;
}

export function RecordPaymentDialog({
  invoiceId,
  currency,
  remainingCents,
}: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountDisplay: centsToDisplay(remainingCents),
      currency: currency as (typeof CURRENCIES)[number],
      method: 'WIRE_TRANSFER',
      paidAt: new Date().toISOString().slice(0, 10),
      reference: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await recordPayment(invoiceId, {
        amountCents: parseCurrencyInput(values.amountDisplay),
        currency: values.currency,
        method: values.method,
        paidAt: new Date(values.paidAt).toISOString(),
        reference: values.reference || null,
      });

      if (result.success) {
        toast.success('Payment recorded');
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error ?? 'Failed to record payment');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <DollarSign className="h-4 w-4" />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amountDisplay">Amount</Label>
              <Input
                id="amountDisplay"
                {...form.register('amountDisplay')}
                className="font-mono"
                placeholder="0.00"
              />
              {form.formState.errors.amountDisplay && (
                <p className="text-xs text-danger">{form.formState.errors.amountDisplay.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payCurrency">Currency</Label>
              <select
                id="payCurrency"
                {...form.register('currency')}
                className="h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="paidAt">Payment date</Label>
              <Input id="paidAt" type="date" {...form.register('paidAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="method">Method</Label>
              <select
                id="method"
                {...form.register('method')}
                className="h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference">Reference / transaction ID</Label>
            <Input
              id="reference"
              {...form.register('reference')}
              placeholder="TXN-123456 or wire reference"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Record payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
