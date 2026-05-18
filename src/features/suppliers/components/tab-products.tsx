'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Package } from 'lucide-react';
import { createProductSchema } from '../schemas';
import { createProduct, updateProduct, deleteProduct } from '../actions';
import type { CreateProductInput } from '../types';
import type { SupplierProduct } from '@prisma/client';

interface TabProductsProps {
  supplierId: string;
  initialProducts: SupplierProduct[];
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function ProductRow({
  product,
  supplierId,
  onDeleted,
}: {
  product: SupplierProduct;
  supplierId: string;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit, reset } = useForm<CreateProductInput>({
    defaultValues: {
      name: product.name,
      sku: product.sku ?? '',
      moq: product.moq,
      unitPriceCents: product.unitPriceCents,
      currency: product.currency,
      leadTimeDays: product.leadTimeDays,
    },
  });

  async function onSave(values: CreateProductInput) {
    setLoading(true);
    try {
      const result = await updateProduct(product.id, supplierId, values);
      if (result.success) {
        toast.success('Product updated');
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    try {
      const result = await deleteProduct(product.id, supplierId);
      if (result.success) {
        toast.success('Product deleted');
        onDeleted(product.id);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <TableRow>
        <TableCell>
          <Input {...register('name')} className="h-7 text-xs" />
        </TableCell>
        <TableCell>
          <Input {...register('sku')} className="h-7 w-24 font-mono text-xs" />
        </TableCell>
        <TableCell>
          <Input
            {...register('moq', { valueAsNumber: true })}
            type="number"
            className="h-7 w-20 text-xs"
          />
        </TableCell>
        <TableCell>
          <Input
            {...register('unitPriceCents', { valueAsNumber: true })}
            type="number"
            className="h-7 w-24 text-xs"
          />
        </TableCell>
        <TableCell>
          <Input
            {...register('leadTimeDays', { valueAsNumber: true })}
            type="number"
            className="h-7 w-16 text-xs"
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" loading={loading} onClick={handleSubmit(onSave)}>
              <Check className="h-3.5 w-3.5 text-success" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                reset();
              }}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>
        {product.sku ? (
          <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>{product.moq?.toLocaleString() ?? '—'}</TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {formatPrice(product.unitPriceCents, product.currency)}
      </TableCell>
      <TableCell>{product.leadTimeDays !== null ? `${product.leadTimeDays}d` : '—'}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" loading={loading} onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-danger" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TabProducts({ supplierId, initialProducts }: TabProductsProps) {
  const t = useTranslations('suppliers.detail.products');
  const [products, setProducts] = React.useState(initialProducts);
  const [showAdd, setShowAdd] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  const { register, handleSubmit, reset } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { currency: 'USD' },
  });

  async function onAdd(values: CreateProductInput) {
    setAdding(true);
    try {
      const result = await createProduct(supplierId, values);
      if (result.success) {
        setProducts((prev) => [...prev, result.data]);
        toast.success('Product added');
        setShowAdd(false);
        reset({ currency: 'USD' });
      } else {
        toast.error(result.error);
      }
    } finally {
      setAdding(false);
    }
  }

  function handleDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (products.length === 0 && !showAdd) {
    return (
      <EmptyState
        icon={Package}
        title={t('empty.title')}
        description={t('empty.description')}
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t('add')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          {t('add')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t('columns.name')}</TableHead>
            <TableHead>{t('columns.sku')}</TableHead>
            <TableHead>{t('columns.moq')}</TableHead>
            <TableHead>{t('columns.unitPrice')}</TableHead>
            <TableHead>{t('columns.leadTime')}</TableHead>
            <TableHead>{t('columns.actions')}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              supplierId={supplierId}
              onDeleted={handleDeleted}
            />
          ))}
          {showAdd && (
            <TableRow>
              <TableCell>
                <Input {...register('name')} placeholder="Product name" className="h-7 text-xs" />
              </TableCell>
              <TableCell>
                <Input
                  {...register('sku')}
                  placeholder="SKU"
                  className="h-7 w-24 font-mono text-xs"
                />
              </TableCell>
              <TableCell>
                <Input
                  {...register('moq', { valueAsNumber: true })}
                  type="number"
                  placeholder="500"
                  className="h-7 w-20 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input
                  {...register('unitPriceCents', { valueAsNumber: true })}
                  type="number"
                  placeholder="Cents"
                  className="h-7 w-24 text-xs"
                />
              </TableCell>
              <TableCell>
                <Input
                  {...register('leadTimeDays', { valueAsNumber: true })}
                  type="number"
                  placeholder="30"
                  className="h-7 w-16 text-xs"
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    loading={adding}
                    onClick={handleSubmit(onAdd)}
                  >
                    <Check className="h-3.5 w-3.5 text-success" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setShowAdd(false);
                      reset();
                    }}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
