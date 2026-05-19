'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from '../schemas';
import { createClient, updateClient } from '../actions';
import { COUNTRIES } from '@/lib/countries';
import type { Client } from '@prisma/client';

type Mode = 'create' | 'edit';

interface ClientFormProps {
  mode: Mode;
  client?: Client;
}

export function ClientForm({ mode, client }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = mode === 'create' ? createClientSchema : updateClientSchema;

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? '',
      email: client?.email ?? '',
      taxId: client?.taxId ?? '',
      addressLine1: client?.addressLine1 ?? '',
      addressLine2: client?.addressLine2 ?? '',
      city: client?.city ?? '',
      postalCode: client?.postalCode ?? '',
      country: client?.country ?? 'FR',
      notes: client?.notes ?? '',
    },
  });

  async function onSubmit(values: CreateClientInput) {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createClient(values);
      } else {
        if (!client) throw new Error('Client is required in edit mode');
        result = await updateClient(client.id, values as UpdateClientInput);
      }

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Something went wrong');
        return;
      }

      toast.success(mode === 'create' ? 'Client created' : 'Client updated');
      router.push(`/clients/${result.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card className="space-y-5 p-6">
        <h2 className="text-sm font-semibold">Company info</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Company name *</Label>
            <Input id="name" {...form.register('name')} placeholder="Acme GmbH" />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="billing@acme.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="taxId">Tax ID / VAT number</Label>
            <Input id="taxId" {...form.register('taxId')} placeholder="FR12 345 678 901" />
          </div>
        </div>
      </Card>

      <Card className="space-y-5 p-6">
        <h2 className="text-sm font-semibold">Address</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input
              id="addressLine1"
              {...form.register('addressLine1')}
              placeholder="12 Rue de la Paix"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              {...form.register('addressLine2')}
              placeholder="Apt, suite, floor…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form.register('city')} placeholder="Paris" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" {...form.register('postalCode')} placeholder="75001" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              {...form.register('country')}
              className="h-9 w-full rounded-md border border-border bg-surface-1 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold">Notes</h2>
        <textarea
          {...form.register('notes')}
          rows={3}
          className="w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Internal notes about this client…"
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create client' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
