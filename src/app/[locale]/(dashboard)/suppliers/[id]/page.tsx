import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentOrg } from '@/lib/auth';
import { getSupplier, getSupplierQualityChecks } from '@/features/suppliers/queries';
import { SupplierHero } from '@/features/suppliers/components/supplier-hero';
import { SupplierTabsNav } from '@/features/suppliers/components/supplier-tabs-nav';
import { TabOverview } from '@/features/suppliers/components/tab-overview';
import { TabProducts } from '@/features/suppliers/components/tab-products';
import { TabDocuments } from '@/features/suppliers/components/tab-documents';
import { TabOrders } from '@/features/suppliers/components/tab-orders';
import { TabQuality } from '@/features/suppliers/components/tab-quality';
import { TabNotes } from '@/features/suppliers/components/tab-notes';
import { TabIntelligence } from '@/features/suppliers/components/tab-intelligence';
import { TableSkeleton } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'overview' | 'products' | 'documents' | 'orders' | 'quality' | 'notes' | 'intelligence';

const VALID_TABS: Tab[] = [
  'overview',
  'products',
  'documents',
  'orders',
  'quality',
  'notes',
  'intelligence',
];

interface SupplierDetailPageProps {
  params: { id: string; locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

export default async function SupplierDetailPage({
  params,
  searchParams,
}: SupplierDetailPageProps) {
  const { orgId } = await getCurrentOrg();

  const rawTab = typeof searchParams['tab'] === 'string' ? searchParams['tab'] : 'overview';
  const activeTab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'overview';

  const [supplier, qualityChecks] = await Promise.all([
    getSupplier(orgId, params.id),
    activeTab === 'quality' ? getSupplierQualityChecks(orgId, params.id) : Promise.resolve([]),
  ]);

  if (!supplier) notFound();

  const latestReport = supplier.intelligenceReports[0] ?? null;

  return (
    <div className="space-y-6">
      <SupplierHero supplier={supplier} />

      <div className="space-y-6">
        <SupplierTabsNav activeTab={activeTab} />

        <div role="tabpanel" aria-label={activeTab}>
          {activeTab === 'overview' && (
            <Suspense fallback={<OverviewSkeleton />}>
              <TabOverview supplier={supplier} orgId={orgId} />
            </Suspense>
          )}

          {activeTab === 'products' && (
            <TabProducts supplierId={supplier.id} initialProducts={supplier.products} />
          )}

          {activeTab === 'documents' && <TabDocuments initialAttachments={supplier.attachments} />}

          {activeTab === 'orders' && (
            <Suspense fallback={<TableSkeleton rows={5} cols={5} />}>
              <TabOrders supplierId={supplier.id} orgId={orgId} />
            </Suspense>
          )}

          {activeTab === 'quality' && <TabQuality qualityChecks={qualityChecks} />}

          {activeTab === 'notes' && (
            <TabNotes supplierId={supplier.id} initialInteractions={supplier.interactions} />
          )}

          {activeTab === 'intelligence' && (
            <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
              <TabIntelligence supplierId={supplier.id} latestReport={latestReport} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
