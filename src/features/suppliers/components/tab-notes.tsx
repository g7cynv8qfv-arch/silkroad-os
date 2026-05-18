'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Mail, Phone, Users, Package, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { createInteractionSchema, INTERACTION_TYPES } from '../schemas';
import { addInteraction } from '../actions';
import type { CreateInteractionInput } from '../types';
import type { SupplierInteraction } from '@prisma/client';

type InteractionWithCreator = SupplierInteraction & {
  createdBy: { firstName: string | null; lastName: string | null } | null;
};

interface TabNotesProps {
  supplierId: string;
  initialInteractions: InteractionWithCreator[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  EMAIL: Mail,
  CALL: Phone,
  MEETING: Users,
  SAMPLE: Package,
  QC: ShieldCheck,
};

const TYPE_LABEL: Record<string, string> = {
  EMAIL: 'Email',
  CALL: 'Call',
  MEETING: 'Meeting',
  SAMPLE: 'Sample',
  QC: 'QC visit',
};

export function TabNotes({ supplierId, initialInteractions }: TabNotesProps) {
  const t = useTranslations('suppliers.detail.notes');
  const [interactions, setInteractions] = React.useState(initialInteractions);
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateInteractionInput>({
    resolver: zodResolver(createInteractionSchema),
    defaultValues: {
      type: 'EMAIL',
      summary: '',
      occurredAt: new Date(),
    },
  });

  async function onSubmit(values: CreateInteractionInput) {
    setSubmitting(true);
    try {
      const result = await addInteraction(supplierId, values);
      if (result.success) {
        setInteractions((prev) => [{ ...result.data, createdBy: null }, ...prev]);
        toast.success('Interaction logged');
        setShowForm(false);
        reset();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-xl border border-border bg-surface-1 p-4"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <select
                    {...field}
                    className="focus-ring flex h-9 w-full rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground"
                  >
                    {INTERACTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date
              </label>
              <input
                type="date"
                {...register('occurredAt')}
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="focus-ring flex h-9 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notes
            </label>
            <textarea
              {...register('summary')}
              placeholder={t('placeholder')}
              rows={3}
              className="focus-ring flex min-h-[80px] w-full resize-none rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            {errors.summary && <p className="mt-1 text-xs text-danger">{errors.summary.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submitting}>
              Log interaction
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t('addNote')}
          </Button>
        </div>
      )}

      {interactions.length === 0 ? (
        <EmptyState icon={Mail} title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <div className="relative space-y-0 pl-4">
          <div className="absolute bottom-3 left-[7px] top-3 w-px bg-border" aria-hidden="true" />
          {interactions.map((interaction) => {
            const Icon = TYPE_ICONS[interaction.type] ?? Mail;
            return (
              <div key={interaction.id} className="relative flex gap-3 pb-6 last:pb-0">
                <div className="absolute -left-4 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface-1 text-muted-foreground">
                  <Icon className="h-2.5 w-2.5" />
                </div>
                <div className="min-w-0 flex-1 pl-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {TYPE_LABEL[interaction.type]}
                    </Badge>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {interaction.occurredAt.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {interaction.createdBy && (
                      <span className="text-xs text-muted-foreground">
                        {interaction.createdBy.firstName} {interaction.createdBy.lastName}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                    {interaction.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
