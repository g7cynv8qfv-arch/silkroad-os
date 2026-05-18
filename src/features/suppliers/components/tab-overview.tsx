import { getSupplierStats } from '../queries';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CountryFlag } from './country-flag';
import { getTranslations } from 'next-intl/server';
import type { SupplierWithRelations } from '../types';
import { Mail, Phone, MessageSquare } from 'lucide-react';

interface TabOverviewProps {
  supplier: SupplierWithRelations;
  orgId: string;
}

function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function TabOverview({ supplier, orgId }: TabOverviewProps) {
  const [t, stats] = await Promise.all([
    getTranslations('suppliers.detail.overview'),
    getSupplierStats(orgId, supplier.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t('stats.totalOrders')} value={String(stats.totalOrders)} />
        <StatCard label={t('stats.totalSpend')} value={formatCents(stats.totalSpendCents)} />
        <StatCard
          label={t('stats.qcPassRate')}
          value={stats.qcPassRate !== null ? `${(stats.qcPassRate * 100).toFixed(0)}%` : '—'}
        />
        <StatCard
          label={t('stats.defectRate')}
          value={
            supplier._count.orders > 0
              ? `${(stats.qcPassRate !== null ? (1 - stats.qcPassRate) * 100 : 0).toFixed(0)}%`
              : '—'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Key contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('contacts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts added yet.</p>
            ) : (
              supplier.contacts.map((contact) => (
                <div key={contact.id} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
                      {contact.isPrimary && (
                        <Badge variant="info" className="px-1.5 py-0 text-[10px]">
                          Primary
                        </Badge>
                      )}
                    </div>
                    {contact.role && (
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </a>
                      )}
                      {contact.wechat && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {contact.wechat}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity logged yet.</p>
            ) : (
              supplier.interactions.slice(0, 5).map((interaction) => (
                <div key={interaction.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="line-clamp-2 text-sm text-foreground">{interaction.summary}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {interaction.type} ·{' '}
                      {interaction.occurredAt.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {interaction.createdBy && (
                        <>
                          {' '}
                          · {interaction.createdBy.firstName} {interaction.createdBy.lastName}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supplier info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              { label: 'Country', value: <CountryFlag code={supplier.country} showName /> },
              { label: 'City', value: supplier.city },
              { label: 'Category', value: supplier.mainCategory },
              { label: 'Year established', value: supplier.yearEstablished },
              { label: 'Employee count', value: supplier.employeeCount?.toLocaleString() },
              {
                label: 'Certifications',
                value:
                  supplier.certifications.length > 0
                    ? supplier.certifications.join(', ')
                    : undefined,
              },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-foreground">{item.value}</dd>
                </div>
              ))}
          </dl>
          {supplier.notes && (
            <div className="mt-4 rounded-lg bg-surface-1 p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Notes
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{supplier.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
