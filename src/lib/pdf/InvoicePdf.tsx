import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCents, taxRateBpsToPct } from '@/lib/currency';

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff',
      fontWeight: 600,
    },
  ],
});

const s = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#18181b',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  brand: { fontSize: 18, fontWeight: 600, color: '#6366f1' },
  tagline: { fontSize: 8, color: '#71717a', marginTop: 2 },
  metaBlock: { alignItems: 'flex-end' },
  metaLabel: { fontSize: 7, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 9, fontWeight: 600, marginTop: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e4e4e7', marginVertical: 16 },
  twoCol: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  col: { flex: 1 },
  sectionLabel: {
    fontSize: 7,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: { fontSize: 9, color: '#3f3f46', lineHeight: 1.5 },
  bold: { fontWeight: 600, color: '#18181b' },
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  thText: {
    fontSize: 7,
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  totalsBlock: { alignItems: 'flex-end', marginBottom: 32 },
  totalRow: { flexDirection: 'row', gap: 24, marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#71717a', minWidth: 80, textAlign: 'right' },
  totalValue: { fontSize: 9, minWidth: 80, textAlign: 'right' },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#18181b',
    minWidth: 80,
    textAlign: 'right',
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6366f1',
    minWidth: 80,
    textAlign: 'right',
  },
  notesSection: { backgroundColor: '#f4f4f5', padding: 12, borderRadius: 4, marginBottom: 24 },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#a1a1aa',
  },
  statusBadge: {
    fontSize: 7,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
});

export type InvoiceForPdf = {
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  taxRateBps: number;
  notes: string | null;
  paymentTermsDays: number | null;
  items: { description: string; quantity: number; unitPriceCents: number; totalCents: number }[];
  client: {
    name: string;
    email: string | null;
    taxId: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
  };
  organization: { name: string };
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#78716c',
  SENT: '#2563eb',
  PAID: '#16a34a',
  OVERDUE: '#dc2626',
  CANCELLED: '#71717a',
};

const TYPE_LABELS: Record<string, string> = {
  PROFORMA: 'Proforma Invoice',
  COMMERCIAL: 'Commercial Invoice',
  CREDIT_NOTE: 'Credit Note',
};

export function InvoicePdfDocument({ invoice }: { invoice: InvoiceForPdf }) {
  const fmt = (cents: number) => formatCents(cents, invoice.currency);
  const taxPct = taxRateBpsToPct(invoice.taxRateBps);
  const statusColor = STATUS_COLORS[invoice.status] ?? '#71717a';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{invoice.organization.name}</Text>
            <Text style={s.tagline}>SilkRoute OS · AI-Powered Sourcing</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>{TYPE_LABELS[invoice.type] ?? invoice.type}</Text>
            <Text style={s.metaValue}>{invoice.invoiceNumber}</Text>
            <View style={[s.statusBadge, { color: statusColor }]}>
              <Text>{invoice.status}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Billing info */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Bill To</Text>
            <Text style={s.bold}>{invoice.client.name}</Text>
            {invoice.client.taxId ? (
              <Text style={s.bodyText}>VAT: {invoice.client.taxId}</Text>
            ) : null}
            {invoice.client.addressLine1 ? (
              <Text style={s.bodyText}>{invoice.client.addressLine1}</Text>
            ) : null}
            {invoice.client.addressLine2 ? (
              <Text style={s.bodyText}>{invoice.client.addressLine2}</Text>
            ) : null}
            {invoice.client.city || invoice.client.postalCode ? (
              <Text style={s.bodyText}>
                {[invoice.client.postalCode, invoice.client.city].filter(Boolean).join(' ')}
              </Text>
            ) : null}
            <Text style={s.bodyText}>{invoice.client.country}</Text>
            {invoice.client.email ? <Text style={s.bodyText}>{invoice.client.email}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Invoice Details</Text>
            <Text style={s.bodyText}>
              Issue date:{' '}
              <Text style={s.bold}>{invoice.issueDate.toLocaleDateString('en-GB')}</Text>
            </Text>
            {invoice.dueDate ? (
              <Text style={s.bodyText}>
                Due date: <Text style={s.bold}>{invoice.dueDate.toLocaleDateString('en-GB')}</Text>
              </Text>
            ) : null}
            {invoice.paymentTermsDays != null ? (
              <Text style={s.bodyText}>Payment terms: Net {invoice.paymentTermsDays}</Text>
            ) : null}
          </View>
        </View>

        {/* Line items */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesc]}>Description</Text>
            <Text style={[s.thText, s.colQty]}>Qty</Text>
            <Text style={[s.thText, s.colUnit]}>Unit price</Text>
            <Text style={[s.thText, s.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.bodyText, s.colDesc]}>{item.description}</Text>
              <Text style={[s.bodyText, s.colQty]}>{item.quantity}</Text>
              <Text style={[s.bodyText, s.colUnit]}>{fmt(item.unitPriceCents)}</Text>
              <Text style={[s.bodyText, s.colTotal]}>{fmt(item.totalCents)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsBlock}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{fmt(invoice.subtotalCents)}</Text>
          </View>
          {invoice.taxRateBps > 0 ? (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>VAT ({taxPct}%)</Text>
              <Text style={s.totalValue}>{fmt(invoice.taxCents)}</Text>
            </View>
          ) : null}
          <View style={[s.totalRow, { marginTop: 6 }]}>
            <Text style={s.grandTotalLabel}>Total</Text>
            <Text style={s.grandTotalValue}>{fmt(invoice.totalCents)}</Text>
          </View>
          {invoice.paidCents > 0 && invoice.paidCents < invoice.totalCents ? (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Paid</Text>
              <Text style={[s.totalValue, { color: '#16a34a' }]}>{fmt(invoice.paidCents)}</Text>
            </View>
          ) : null}
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={s.notesSection}>
            <Text style={s.sectionLabel}>Payment instructions</Text>
            <Text style={s.bodyText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.footer}>
          <Text>{invoice.organization.name} · Generated by SilkRoute OS</Text>
          <Text>{invoice.invoiceNumber}</Text>
        </View>
      </Page>
    </Document>
  );
}
