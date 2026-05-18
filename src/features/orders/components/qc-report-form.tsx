'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from '@/lib/i18n/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { createQcReportSchema } from '../schemas';
import { createQcReport } from '../actions';
import type { CreateQcReportInput } from '../types';

interface QcReportFormProps {
  orderId: string;
  orderNumber: string;
}

export function QcReportForm({ orderId, orderNumber }: QcReportFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQcReportInput>({
    resolver: zodResolver(createQcReportSchema),
    defaultValues: {
      performedAt: new Date().toISOString(),
      passed: true,
      defectsFound: 0,
    },
  });

  const passed = watch('passed');

  async function onSubmit(data: CreateQcReportInput) {
    setSubmitting(true);
    try {
      const result = await createQcReport(orderId, data);
      if (result.success) {
        toast.success('QC report saved');
        router.push(`/orders/${orderId}`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Quality inspection report for order{' '}
        <span className="font-mono font-medium text-foreground">{orderNumber}</span>
      </p>

      {/* Pass / Fail toggle */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Inspection result *</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setValue('passed', true)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors',
              passed
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-border text-muted-foreground hover:border-emerald-500/50',
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Passed
          </button>
          <button
            type="button"
            onClick={() => setValue('passed', false)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors',
              !passed
                ? 'border-danger bg-danger/10 text-danger'
                : 'border-border text-muted-foreground hover:border-danger/50',
            )}
          >
            <XCircle className="h-4 w-4" />
            Failed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Date performed" required error={errors.performedAt?.message}>
          <Input
            type="datetime-local"
            {...register('performedAt', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
            })}
            defaultValue={new Date().toISOString().slice(0, 16)}
          />
        </FormField>

        <FormField label="Inspector name" error={errors.inspector?.message}>
          <Input {...register('inspector')} placeholder="John Smith" />
        </FormField>

        <FormField label="Defects found" required error={errors.defectsFound?.message}>
          <Input type="number" min={0} {...register('defectsFound', { valueAsNumber: true })} />
        </FormField>

        <FormField label="Report URL" error={errors.reportUrl?.message}>
          <Input type="url" {...register('reportUrl')} placeholder="https://drive.google.com/..." />
        </FormField>

        <div className="sm:col-span-2">
          <FormField label="Notes" error={errors.notes?.message}>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Describe defects, conditions, recommendations…"
              className="focus-ring flex min-h-[100px] w-full resize-none rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </FormField>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => router.push(`/orders/${orderId}`)}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving…' : 'Save QC report'}
        </Button>
      </div>
    </form>
  );
}
