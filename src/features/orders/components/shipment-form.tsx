'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { createShipmentSchema, SHIPMENT_MODES } from '../schemas';
import { createShipment, updateShipment } from '../actions';
import type { CreateShipmentInput } from '../types';
import type { Shipment } from '@prisma/client';

const MODE_LABELS: Record<string, string> = {
  AIR: 'Air',
  SEA: 'Sea',
  RAIL: 'Rail',
  ROAD: 'Road',
};

interface ShipmentFormProps {
  orderId: string;
  orderNumber: string;
  existingShipment?: Shipment | null;
}

function dateToLocal(d: Date | null | undefined): string {
  if (!d) return '';
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 16);
}

export function ShipmentForm({ orderId, orderNumber, existingShipment }: ShipmentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = Boolean(existingShipment);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateShipmentInput>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: existingShipment
      ? {
          carrier: existingShipment.carrier ?? '',
          trackingNumber: existingShipment.trackingNumber ?? '',
          mode: existingShipment.mode,
          etd: dateToLocal(existingShipment.etd),
          eta: dateToLocal(existingShipment.eta),
        }
      : {
          mode: 'SEA',
        },
  });

  async function onSubmit(data: CreateShipmentInput) {
    setSubmitting(true);
    try {
      const result =
        isEdit && existingShipment
          ? await updateShipment(existingShipment.id, orderId, data)
          : await createShipment(orderId, data);

      if (result.success) {
        toast.success(isEdit ? 'Shipment updated' : 'Shipment created');
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
        {isEdit ? 'Edit' : 'Add'} shipment for order{' '}
        <span className="font-mono font-medium text-foreground">{orderNumber}</span>
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Carrier" error={errors.carrier?.message}>
          <Input {...register('carrier')} placeholder="Maersk, DHL, FedEx…" />
        </FormField>

        <FormField label="Tracking number" error={errors.trackingNumber?.message}>
          <Input {...register('trackingNumber')} placeholder="MSKU1234567" className="font-mono" />
        </FormField>

        <FormField label="Mode" required error={errors.mode?.message}>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? 'SEA'}
                className="focus-ring flex h-9 w-full rounded-md border border-border bg-surface-1 px-3 py-1.5 text-sm text-foreground"
              >
                {SHIPMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            )}
          />
        </FormField>

        <div />

        <FormField label="ETD (departure)" error={errors.etd?.message}>
          <Input
            type="datetime-local"
            {...register('etd', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : null),
            })}
            defaultValue={existingShipment ? dateToLocal(existingShipment.etd) : ''}
          />
        </FormField>

        <FormField label="ETA (arrival)" error={errors.eta?.message}>
          <Input
            type="datetime-local"
            {...register('eta', {
              setValueAs: (v: string) => (v ? new Date(v).toISOString() : null),
            })}
            defaultValue={existingShipment ? dateToLocal(existingShipment.eta) : ''}
          />
        </FormField>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={() => router.push(`/orders/${orderId}`)}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Update shipment' : 'Add shipment'}
        </Button>
      </div>
    </form>
  );
}
