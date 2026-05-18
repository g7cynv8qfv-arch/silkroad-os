'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@/lib/i18n/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { createOrderSchema, CURRENCIES } from '../schemas';
import { createOrder } from '../actions';
import type { CreateOrderInput } from '../types';

// ─── Supplier type (lean projection) ─────────────────────────────────────────

interface SupplierOption {
  id: string;
  name: string;
  country: string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ['Supplier', 'Items', 'Terms', 'Review'] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Form steps" className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className={cn('h-px flex-1', done ? 'bg-accent' : 'bg-border')} aria-hidden />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-accent text-accent-foreground',
                  active && 'bg-accent/15 text-accent ring-2 ring-accent',
                  !done && !active && 'bg-surface-2 text-muted-foreground',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs sm:block',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Step 1: Select supplier ──────────────────────────────────────────────────

function Step1({
  suppliers,
  form,
}: {
  suppliers: SupplierOption[];
  form: ReturnType<typeof useForm<CreateOrderInput>>;
}) {
  const [query, setQuery] = React.useState('');
  const selected = form.watch('supplierId');

  const filtered = query
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.country.toLowerCase().includes(query.toLowerCase()),
      )
    : suppliers;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search suppliers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {suppliers.length === 0 ? (
        <p className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
          No suppliers found. Add a supplier first.
        </p>
      ) : (
        <div className="max-h-[340px] overflow-y-auto rounded-lg border border-border">
          {/* No supplier option */}
          <button
            type="button"
            onClick={() => form.setValue('supplierId', undefined)}
            className={cn(
              'flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-surface-2/50',
              !selected && 'bg-accent/5 text-foreground',
            )}
          >
            <div
              className={cn(
                'h-4 w-4 rounded-full border-2',
                !selected ? 'border-accent bg-accent' : 'border-border',
              )}
            />
            <span className="text-sm text-muted-foreground">No supplier (free-text entry)</span>
          </button>

          {filtered.map((supplier) => (
            <button
              key={supplier.id}
              type="button"
              onClick={() => form.setValue('supplierId', supplier.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2/50',
                selected === supplier.id && 'bg-accent/5',
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 shrink-0 rounded-full border-2',
                  selected === supplier.id ? 'border-accent bg-accent' : 'border-border',
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{supplier.name}</p>
                <p className="text-xs text-muted-foreground">{supplier.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Add items ────────────────────────────────────────────────────────

function Step2({ form }: { form: ReturnType<typeof useForm<CreateOrderInput>> }) {
  const currency = form.watch('currency') ?? 'USD';
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const items = form.watch('items') ?? [];

  const totalCents = items.reduce(
    (sum, item) => sum + (item.unitPriceCents ?? 0) * (item.quantity ?? 0),
    0,
  );

  function addRow() {
    append({ productName: '', sku: '', quantity: 1, unitPriceCents: 0 });
  }

  const fmtCents = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Product *
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                SKU
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Qty *
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Unit price *
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                Total
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => {
              const qty = form.watch(`items.${i}.quantity`) ?? 1;
              const price = form.watch(`items.${i}.unitPriceCents`) ?? 0;
              const rowTotal = qty * price;

              return (
                <tr key={field.id} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2">
                    <Input
                      {...form.register(`items.${i}.productName`)}
                      placeholder="Product name"
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      {...form.register(`items.${i}.sku`)}
                      placeholder="SKU"
                      className="h-8 font-mono text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      {...form.register(`items.${i}.quantity`, { valueAsNumber: true })}
                      className="h-8 text-right text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      {...form.register(`items.${i}.unitPriceCents`, { valueAsNumber: true })}
                      placeholder="Price in cents"
                      className="h-8 text-right font-mono text-xs"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-medium text-foreground">
                    {fmtCents(rowTotal)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-muted-foreground transition-colors hover:text-danger"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {fields.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-surface-2">
                <td
                  colSpan={4}
                  className="px-3 py-2.5 text-right text-xs font-semibold text-foreground"
                >
                  Total
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-foreground">
                  {fmtCents(totalCents)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5" />
        Add item
      </Button>

      {(form.formState.errors.items as { message?: string } | undefined)?.message && (
        <p className="text-xs text-danger">
          {(form.formState.errors.items as { message?: string }).message}
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Terms ────────────────────────────────────────────────────────────

function Step3({ form }: { form: ReturnType<typeof useForm<CreateOrderInput>> }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Currency" required>
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <select
              {...field}
              value={field.value ?? 'USD'}
              className="focus-ring flex h-9 w-full rounded-md border border-border bg-surface-1 px-3 py-1.5 text-sm text-foreground"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        />
      </FormField>

      <FormField label="Expected delivery date">
        <Input
          type="datetime-local"
          {...form.register('expectedDeliveryAt', {
            setValueAs: (v: string) => (v ? new Date(v).toISOString() : undefined),
          })}
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label="Notes">
          <textarea
            {...form.register('notes')}
            rows={4}
            placeholder="Payment terms, special instructions, sourcing context…"
            className="focus-ring flex min-h-[100px] w-full resize-none rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </FormField>
      </div>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4({
  form,
  suppliers,
}: {
  form: ReturnType<typeof useForm<CreateOrderInput>>;
  suppliers: SupplierOption[];
}) {
  const values = form.getValues();
  const supplier = suppliers.find((s) => s.id === values.supplierId);
  const currency = values.currency ?? 'USD';
  const totalCents = (values.items ?? []).reduce(
    (sum, item) => sum + (item.unitPriceCents ?? 0) * (item.quantity ?? 0),
    0,
  );

  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Supplier</span>
            <span className="font-medium text-foreground">{supplier?.name ?? 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items</span>
            <span className="font-medium text-foreground">{values.items?.length ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-bold text-foreground">{fmt(totalCents)}</span>
          </div>
          {values.expectedDeliveryAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected delivery</span>
              <span className="font-mono text-foreground">
                {new Date(values.expectedDeliveryAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
          {values.notes && (
            <div>
              <span className="text-muted-foreground">Notes</span>
              <p className="mt-1 text-xs text-foreground">{values.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface OrderFormProps {
  suppliers: SupplierOption[];
}

export function OrderForm({ suppliers }: OrderFormProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      currency: 'USD',
      items: [{ productName: '', sku: '', quantity: 1, unitPriceCents: 0 }],
    },
  });

  async function handleNext() {
    if (step === 1) {
      const valid = await form.trigger('items');
      if (!valid) return;
    }
    setStep((s) => s + 1);
  }

  async function onSubmit(data: CreateOrderInput) {
    setSubmitting(true);
    try {
      const result = await createOrder(data);
      if (result.success) {
        toast.success('Order created');
        router.push(`/orders/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === STEP_LABELS.length - 1;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <StepIndicator current={step} />

      <div className="min-h-[300px]">
        {step === 0 && <Step1 suppliers={suppliers} form={form} />}
        {step === 1 && <Step2 form={form} />}
        {step === 2 && <Step3 form={form} />}
        {step === 3 && <Step4 form={form} suppliers={suppliers} />}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (step > 0 ? setStep((s) => s - 1) : router.push('/orders'))}
        >
          {step > 0 ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </>
          ) : (
            'Cancel'
          )}
        </Button>

        {isLastStep ? (
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating…' : 'Create order'}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
