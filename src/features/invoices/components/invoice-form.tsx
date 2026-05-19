'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  formatCents,
  centsToDisplay,
  parseCurrencyInput,
  computeInvoiceTotals,
  taxRatePctToBps,
} from '@/lib/currency';
import { createInvoice } from '../actions';
import { CURRENCIES } from '@/lib/currency';
import type { Client, Order, OrderItem } from '@prisma/client';

// ─── Form schema (UI layer — uses display values) ──────────────────────────────

const formItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  quantity: z.coerce.number().int().min(1, 'Min 1'),
  unitPriceDisplay: z.string().min(1, 'Required'),
});

const formSchema = z.object({
  clientId: z.string().min(1, 'Select a client'),
  orderId: z.string().optional(),
  type: z.enum(['PROFORMA', 'COMMERCIAL', 'CREDIT_NOTE']),
  currency: z.enum(CURRENCIES),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  taxRatePct: z.coerce.number().min(0).max(500),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
  notes: z.string().optional(),
  items: z.array(formItemSchema).min(1, 'At least one item required'),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  clients: Pick<Client, 'id' | 'name' | 'email'>[];
  orders?: (Pick<Order, 'id' | 'orderNumber'> & {
    items: Pick<OrderItem, 'productName' | 'quantity' | 'unitPriceCents'>[];
  })[];
}

const today = new Date().toISOString().slice(0, 10);

export function InvoiceForm({ clients, orders = [] }: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      orderId: '',
      type: 'COMMERCIAL',
      currency: 'USD',
      issueDate: today,
      dueDate: '',
      taxRatePct: 0,
      paymentTermsDays: undefined,
      notes: '',
      items: [{ description: '', quantity: 1, unitPriceDisplay: '0.00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const watchedItems = form.watch('items');
  const currency = form.watch('currency');
  const taxRatePct = form.watch('taxRatePct');
  const orderId = form.watch('orderId');

  // Pre-fill from order
  useEffect(() => {
    if (!orderId) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    form.setValue(
      'items',
      order.items.map((i) => ({
        description: i.productName,
        quantity: i.quantity,
        unitPriceDisplay: centsToDisplay(i.unitPriceCents),
      })),
    );
  }, [orderId, orders, form]);

  const totals = computeInvoiceTotals(
    watchedItems.map((i) => ({
      quantity: Number(i.quantity) || 0,
      unitPriceCents: parseCurrencyInput(i.unitPriceDisplay),
    })),
    taxRatePctToBps(Number(taxRatePct) || 0),
  );

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await createInvoice({
        clientId: values.clientId,
        orderId: values.orderId || undefined,
        type: values.type,
        currency: values.currency,
        issueDate: values.issueDate ? new Date(values.issueDate).toISOString() : undefined,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        taxRateBps: taxRatePctToBps(values.taxRatePct),
        paymentTermsDays: values.paymentTermsDays ?? null,
        notes: values.notes ?? null,
        items: values.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: parseCurrencyInput(item.unitPriceDisplay),
        })),
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Failed to create invoice');
        return;
      }

      toast.success('Invoice created successfully');
      router.push(`/invoices/${result.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Card className="space-y-6 p-6">
        <h2 className="text-sm font-semibold text-foreground">Invoice details</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Client */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="clientId">Client *</Label>
            <select
              id="clientId"
              {...form.register('clientId')}
              className="h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {form.formState.errors.clientId && (
              <p className="text-xs text-danger">{form.formState.errors.clientId.message}</p>
            )}
          </div>

          {/* Linked order */}
          {orders.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="orderId">Link to order (optional)</Label>
              <select
                id="orderId"
                {...form.register('orderId')}
                className="h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">None</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              {...form.register('type')}
              className="h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="COMMERCIAL">Commercial invoice</option>
              <option value="PROFORMA">Proforma invoice</option>
              <option value="CREDIT_NOTE">Credit note</option>
            </select>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
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

          {/* Issue date */}
          <div className="space-y-1.5">
            <Label htmlFor="issueDate">Issue date</Label>
            <Input id="issueDate" type="date" {...form.register('issueDate')} />
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...form.register('dueDate')} />
          </div>

          {/* VAT rate */}
          <div className="space-y-1.5">
            <Label htmlFor="taxRatePct">VAT rate (%)</Label>
            <Input
              id="taxRatePct"
              type="number"
              step="0.1"
              min={0}
              max={500}
              {...form.register('taxRatePct')}
              placeholder="0"
            />
          </div>

          {/* Payment terms */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
            <Input
              id="paymentTermsDays"
              type="number"
              min={0}
              max={365}
              {...form.register('paymentTermsDays')}
              placeholder="30"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Payment instructions / bank details</Label>
          <textarea
            id="notes"
            {...form.register('notes')}
            rows={3}
            className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Bank: BNP Paribas · IBAN: FR76 1234…"
          />
        </div>
      </Card>

      {/* Line items */}
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Line items</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: '', quantity: 1, unitPriceDisplay: '0.00' })}
          >
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        </div>

        {/* Header */}
        <div className="hidden grid-cols-[1fr_80px_120px_32px] gap-3 px-1 sm:grid">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Description
          </span>
          <span className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Qty
          </span>
          <span className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Unit price
          </span>
          <span />
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => {
            const qty = Number(watchedItems[index]?.quantity) || 0;
            const unitCents = parseCurrencyInput(watchedItems[index]?.unitPriceDisplay ?? '0');
            const lineCents = qty * unitCents;

            return (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_80px_120px_32px] items-start gap-3"
              >
                <div>
                  <Input
                    {...form.register(`items.${index}.description`)}
                    placeholder="Product or service description"
                  />
                  {form.formState.errors.items?.[index]?.description && (
                    <p className="mt-1 text-xs text-danger">
                      {form.formState.errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>
                <Input
                  {...form.register(`items.${index}.quantity`)}
                  type="number"
                  min={1}
                  className="text-right"
                />
                <div>
                  <Input
                    {...form.register(`items.${index}.unitPriceDisplay`)}
                    className="text-right font-mono"
                    placeholder="0.00"
                  />
                  {lineCents > 0 && (
                    <p className="mt-1 text-right font-mono text-xs text-muted-foreground">
                      {formatCents(lineCents, currency)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-danger"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-medium">
              {formatCents(totals.subtotalCents, currency)}
            </span>
          </div>
          {totals.taxCents > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">VAT ({taxRatePct}%)</span>
              <span className="font-mono font-medium">
                {formatCents(totals.taxCents, currency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="font-mono text-accent">
              {formatCents(totals.totalCents, currency)}
            </span>
          </div>
        </div>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create invoice'}
        </Button>
      </div>
    </form>
  );
}
