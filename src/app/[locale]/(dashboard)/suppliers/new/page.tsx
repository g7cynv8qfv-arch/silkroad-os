import { getTranslations } from 'next-intl/server';
import { getCurrentOrg } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { SupplierForm } from '@/features/suppliers/components/supplier-form';

export default async function NewSupplierPage() {
  const [t] = await Promise.all([getTranslations('suppliers.form.create'), getCurrentOrg()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t('title')}
        breadcrumbs={[{ label: 'Suppliers', href: '/suppliers' }, { label: t('title') }]}
      />

      <Card>
        <CardContent className="pt-6">
          <SupplierForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
