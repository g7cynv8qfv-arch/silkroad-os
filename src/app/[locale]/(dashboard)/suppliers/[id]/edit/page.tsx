import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { getSupplier } from '@/features/suppliers/queries';
import { SupplierForm } from '@/features/suppliers/components/supplier-form';

interface EditSupplierPageProps {
  params: { id: string; locale: string };
}

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const [t, { orgId }] = await Promise.all([getTranslations('suppliers.form'), getCurrentOrg()]);

  const supplier = await getSupplier(orgId, params.id);
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t('edit.title')}
        breadcrumbs={[
          { label: 'Suppliers', href: '/suppliers' },
          { label: supplier.name, href: `/suppliers/${supplier.id}` },
          { label: t('edit.title') },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <SupplierForm
            mode="edit"
            supplierId={supplier.id}
            defaultValues={{
              name: supplier.name,
              country: supplier.country,
              city: supplier.city ?? undefined,
              websiteUrl: supplier.websiteUrl ?? undefined,
              alibabaUrl: supplier.alibabaUrl ?? undefined,
              the1688Url: supplier.the1688Url ?? undefined,
              mainCategory: supplier.mainCategory ?? undefined,
              yearEstablished: supplier.yearEstablished,
              employeeCount: supplier.employeeCount,
              certifications: supplier.certifications,
              notes: supplier.notes ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
