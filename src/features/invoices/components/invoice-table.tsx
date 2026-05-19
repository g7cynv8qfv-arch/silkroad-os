'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { formatCents } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { deleteInvoice } from '../actions';
import type { InvoiceListItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  PROFORMA: 'Proforma',
  COMMERCIAL: 'Commercial',
  CREDIT_NOTE: 'Credit note',
};

function DeleteInvoiceButton({ invoice }: { invoice: InvoiceListItem }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = ['DRAFT', 'CANCELLED'].includes(invoice.status);
  if (!canDelete) return null;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteInvoice(invoice.id);
      if (result.success) {
        toast.success(`Facture ${invoice.invoiceNumber} supprimée`);
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Erreur lors de la suppression');
        setIsDeleting(false);
      }
    } catch {
      toast.error('Une erreur est survenue');
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="rounded p-1.5 text-muted-foreground transition-colors hover:text-danger"
        aria-label="Supprimer la facture"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la facture</DialogTitle>
            <DialogDescription>
              Supprimer <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>{' '}
              définitivement ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost" disabled={isDeleting}>
                Annuler
              </Button>
            </DialogClose>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface InvoiceTableProps {
  items: InvoiceListItem[];
}

export function InvoiceTable({ items }: InvoiceTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issue date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due date</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((invoice) => {
            const balance = invoice.totalCents - invoice.paidCents;
            const isOverdue = invoice.status === 'OVERDUE';
            return (
              <tr
                key={invoice.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-mono text-xs font-medium text-accent hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{invoice.client.name}</span>
                  {invoice.client.email && (
                    <span className="block text-xs text-muted-foreground">
                      {invoice.client.email}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {TYPE_LABELS[invoice.type] ?? invoice.type}
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={invoice.status as never} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {invoice.issueDate.toLocaleDateString('en-GB')}
                </td>
                <td
                  className={`px-4 py-3 ${isOverdue ? 'font-medium text-danger' : 'text-muted-foreground'}`}
                >
                  {invoice.dueDate ? invoice.dueDate.toLocaleDateString('en-GB') : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {formatCents(invoice.totalCents, invoice.currency)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${balance > 0 ? 'text-warning' : 'text-success'}`}
                >
                  {balance > 0 ? formatCents(balance, invoice.currency) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteInvoiceButton invoice={invoice} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
