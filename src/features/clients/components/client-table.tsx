'use client';

import { Link } from '@/lib/i18n/navigation';
import { formatCents } from '@/lib/currency';
import { Building2 } from 'lucide-react';
import type { ClientListItem } from '../types';

interface ClientTableProps {
  items: ClientListItem[];
}

export function ClientTable({ items }: ClientTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Country</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tax ID</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Invoices</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              Total revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((client) => (
            <tr
              key={client.id}
              className="border-b border-border transition-colors last:border-0 hover:bg-surface-2"
            >
              <td className="px-4 py-3">
                <Link href={`/clients/${client.id}`} className="group flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground transition-colors group-hover:text-accent">
                      {client.name}
                    </p>
                    {client.email && (
                      <p className="text-xs text-muted-foreground">{client.email}</p>
                    )}
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{client.country}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {client.taxId ?? '—'}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {client._count.invoices}
              </td>
              <td className="px-4 py-3 text-right font-mono font-medium">
                {client.totalRevenueCents > 0 ? formatCents(client.totalRevenueCents, 'USD') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
