'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { COUNTRIES } from '@/lib/countries';
import {
  createSupplierStep1Schema,
  createSupplierStep2Schema,
  createSupplierStep3Schema,
  createSupplierSchema,
  updateSupplierSchema,
  SUPPLIER_CATEGORIES,
} from '../schemas';
import { createSupplier, updateSupplier } from '../actions';
import type { CreateSupplierInput, UpdateSupplierInput } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type CreateMode = { mode: 'create' };
type EditMode = { mode: 'edit'; supplierId: string; defaultValues: Partial<CreateSupplierInput> };
type FormMode = CreateMode | EditMode;

type SupplierFormProps = FormMode;

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Company info', 'Contacts', 'Products'] as const;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <nav aria-label="Form steps" className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className={cn('h-px flex-1', done ? 'bg-accent' : 'bg-border')} />}
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
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Shared field component ───────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring flex h-9 w-full rounded-md border border-border bg-surface-1 px-3 py-1.5 text-sm text-foreground"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

// ─── Step 1: Company info ─────────────────────────────────────────────────────

function Step1({ form }: { form: ReturnType<typeof useForm<CreateSupplierInput>> }) {
  const t = useTranslations('suppliers.form.fields');
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormField label={t('name')} required error={errors.name?.message}>
          <Input {...register('name')} placeholder={t('namePlaceholder')} />
        </FormField>
      </div>

      <Controller
        control={control}
        name="country"
        render={({ field }) => (
          <SelectField
            label={t('country')}
            required
            value={field.value ?? 'CN'}
            onChange={field.onChange}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
          />
        )}
      />

      <FormField label={t('city')} error={errors.city?.message}>
        <Input {...register('city')} placeholder={t('cityPlaceholder')} />
      </FormField>

      <FormField label={t('websiteUrl')} error={errors.websiteUrl?.message}>
        <Input {...register('websiteUrl')} placeholder={t('websitePlaceholder')} type="url" />
      </FormField>

      <FormField label={t('alibabaUrl')}>
        <Input {...register('alibabaUrl')} placeholder="https://..." type="url" />
      </FormField>

      <FormField label={t('the1688Url')}>
        <Input {...register('the1688Url')} placeholder="https://..." type="url" />
      </FormField>

      <Controller
        control={control}
        name="mainCategory"
        render={({ field }) => (
          <SelectField
            label={t('mainCategory')}
            value={field.value ?? ''}
            onChange={field.onChange}
            placeholder="Select category…"
            options={SUPPLIER_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        )}
      />

      <FormField label={t('yearEstablished')} error={errors.yearEstablished?.message}>
        <Input
          {...register('yearEstablished', { valueAsNumber: true })}
          type="number"
          min={1800}
          max={new Date().getFullYear()}
          placeholder="2005"
        />
      </FormField>

      <FormField label={t('employeeCount')} error={errors.employeeCount?.message}>
        <Input
          {...register('employeeCount', { valueAsNumber: true })}
          type="number"
          min={1}
          placeholder="200"
        />
      </FormField>

      <div className="sm:col-span-2">
        <FormField label={t('notes')}>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Internal notes about this supplier…"
            className="focus-ring flex min-h-[80px] w-full resize-none rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </FormField>
      </div>
    </div>
  );
}

// ─── Step 2: Contacts ─────────────────────────────────────────────────────────

function Step2({ form }: { form: ReturnType<typeof useForm<CreateSupplierInput>> }) {
  const t = useTranslations('suppliers.form');
  const tf = useTranslations('suppliers.form.fields');
  const { register, control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  function addContact() {
    append({
      name: '',
      role: '',
      email: '',
      phone: '',
      wechat: '',
      whatsapp: '',
      isPrimary: false,
    });
  }

  return (
    <div className="space-y-4">
      {fields.map((field, i) => {
        return (
          <Card key={field.id} className="relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t('actions.addContact')} {i + 1}
              </CardTitle>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-danger"
                aria-label="Remove contact"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label={tf('contactName')} required>
                <Input {...register(`contacts.${i}.name`)} placeholder="Zhang Wei" />
              </FormField>
              <FormField label={tf('contactRole')}>
                <Input {...register(`contacts.${i}.role`)} placeholder="Sales Manager" />
              </FormField>
              <FormField label={tf('contactEmail')}>
                <Input
                  {...register(`contacts.${i}.email`)}
                  type="email"
                  placeholder="contact@supplier.com"
                />
              </FormField>
              <FormField label={tf('contactPhone')}>
                <Input {...register(`contacts.${i}.phone`)} placeholder="+86 138 0000 0000" />
              </FormField>
              <FormField label={tf('contactWechat')}>
                <Input {...register(`contacts.${i}.wechat`)} placeholder="wechat_id" />
              </FormField>
              <FormField label={tf('contactWhatsapp')}>
                <Input {...register(`contacts.${i}.whatsapp`)} placeholder="+86 138 0000 0000" />
              </FormField>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register(`contacts.${i}.isPrimary`)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                <span className="text-foreground">{tf('isPrimary')}</span>
              </label>
            </CardContent>
          </Card>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addContact}>
        <Plus className="h-3.5 w-3.5" />
        {t('actions.addContact')}
      </Button>
    </div>
  );
}

// ─── Step 3: Products ─────────────────────────────────────────────────────────

function Step3({ form }: { form: ReturnType<typeof useForm<CreateSupplierInput>> }) {
  const t = useTranslations('suppliers.form');
  const tf = useTranslations('suppliers.form.fields');
  const { register, control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  function addProduct() {
    append({
      name: '',
      sku: '',
      moq: null,
      unitPriceCents: null,
      currency: 'USD',
      leadTimeDays: null,
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('steps.3')} — optional. You can add products later.
      </p>
      {fields.map((field, i) => (
        <Card key={field.id} className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Product {i + 1}</CardTitle>
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-danger"
              aria-label="Remove product"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={tf('productName')} required>
              <Input {...register(`products.${i}.name`)} placeholder="Wireless Earbuds" />
            </FormField>
            <FormField label={tf('productSku')}>
              <Input {...register(`products.${i}.sku`)} placeholder="SKU-001" />
            </FormField>
            <FormField label={tf('moq')}>
              <Input
                {...register(`products.${i}.moq`, { valueAsNumber: true })}
                type="number"
                min={1}
                placeholder="500"
              />
            </FormField>
            <FormField label={tf('unitPrice')}>
              <Input
                {...register(`products.${i}.unitPriceCents`, { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="Price in cents (e.g. 1299)"
              />
            </FormField>
            <FormField label={tf('currency')}>
              <Input {...register(`products.${i}.currency`)} placeholder="USD" maxLength={3} />
            </FormField>
            <FormField label={tf('leadTimeDays')}>
              <Input
                {...register(`products.${i}.leadTimeDays`, { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="30"
              />
            </FormField>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addProduct}>
        <Plus className="h-3.5 w-3.5" />
        {t('actions.addProduct')}
      </Button>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function SupplierForm(props: SupplierFormProps) {
  const t = useTranslations('suppliers.form');
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEdit = props.mode === 'edit';

  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(isEdit ? updateSupplierSchema : createSupplierSchema),
    defaultValues: isEdit
      ? { ...(props.defaultValues as CreateSupplierInput), contacts: [], products: [] }
      : { country: 'CN', contacts: [], products: [], certifications: [] },
  });

  const STEP_SCHEMAS = [
    createSupplierStep1Schema,
    createSupplierStep2Schema,
    createSupplierStep3Schema,
  ];

  async function validateStep(stepIdx: number): Promise<boolean> {
    const schema = STEP_SCHEMAS[stepIdx];
    if (!schema) return true;
    const values = form.getValues();
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const path = err.path.join('.') as Parameters<typeof form.setError>[0];
        form.setError(path, { message: err.message });
      });
      return false;
    }
    return true;
  }

  async function handleNext() {
    const valid = await validateStep(step);
    if (valid) setStep((s) => s + 1);
  }

  async function handleSubmit(values: CreateSupplierInput) {
    setIsSubmitting(true);
    try {
      if (isEdit) {
        const result = await updateSupplier(props.supplierId, values as UpdateSupplierInput);
        if (result.success) {
          toast.success(t('success.updated'));
          router.push(`/suppliers/${props.supplierId}`);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createSupplier(values);
        if (result.success) {
          toast.success(t('success.created'));
          router.push(`/suppliers/${result.data.id}`);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastStep = isEdit || step === STEPS.length - 1;

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {!isEdit && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'text-xs',
                  i === step ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {s}
              </span>
            ))}
          </div>
          <StepIndicator current={step} total={STEPS.length} />
        </div>
      )}

      <div>
        {(isEdit || step === 0) && <Step1 form={form} />}
        {!isEdit && step === 1 && <Step2 form={form} />}
        {!isEdit && step === 2 && <Step3 form={form} />}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (step > 0 ? setStep((s) => s - 1) : router.push('/suppliers'))}
        >
          {step > 0 ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              {t('actions.prev')}
            </>
          ) : (
            t('actions.cancel')
          )}
        </Button>

        {isLastStep ? (
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? t('actions.saving') : t('actions.save')}
          </Button>
        ) : (
          <Button type="button" onClick={handleNext}>
            {t('actions.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
