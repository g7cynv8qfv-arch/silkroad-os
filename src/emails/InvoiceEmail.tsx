import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Hr,
} from '@react-email/components';
import { formatCents, taxRateBpsToPct } from '@/lib/currency';

type InvoiceEmailProps = {
  invoice: {
    invoiceNumber: string;
    type: string;
    status: string;
    issueDate: Date;
    dueDate: Date | null;
    currency: string;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    taxRateBps: number;
    notes: string | null;
    items: { description: string; quantity: number; unitPriceCents: number; totalCents: number }[];
    client: { name: string; email: string | null };
    organization: { name: string };
  };
};

const TYPE_LABELS: Record<string, string> = {
  PROFORMA: 'Proforma Invoice',
  COMMERCIAL: 'Commercial Invoice',
  CREDIT_NOTE: 'Credit Note',
};

export function InvoiceEmailTemplate({ invoice }: InvoiceEmailProps) {
  const fmt = (cents: number) => formatCents(cents, invoice.currency);
  const taxPct = taxRateBpsToPct(invoice.taxRateBps);
  const typeLabel = TYPE_LABELS[invoice.type] ?? invoice.type;

  return (
    <Html lang="en">
      <Head />
      <Body
        style={{ backgroundColor: '#f4f4f5', fontFamily: 'Inter, Arial, sans-serif', margin: 0 }}
      >
        <Container
          style={{
            maxWidth: 600,
            margin: '32px auto',
            backgroundColor: '#ffffff',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e4e4e7',
          }}
        >
          {/* Header */}
          <Section style={{ backgroundColor: '#18181b', padding: '24px 32px' }}>
            <Text style={{ color: '#6366f1', fontSize: 20, fontWeight: 700, margin: 0 }}>
              {invoice.organization.name}
            </Text>
            <Text style={{ color: '#a1a1aa', fontSize: 12, margin: '4px 0 0' }}>
              SilkRoute OS · AI-Powered Sourcing
            </Text>
          </Section>

          {/* Invoice meta */}
          <Section style={{ padding: '24px 32px', borderBottom: '1px solid #e4e4e7' }}>
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>
              {typeLabel}
            </Text>
            <Text style={{ fontSize: 14, color: '#71717a', margin: '0 0 16px' }}>
              {invoice.invoiceNumber}
            </Text>
            <Row>
              <Column>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#a1a1aa',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    margin: '0 0 2px',
                  }}
                >
                  Bill to
                </Text>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#18181b', margin: 0 }}>
                  {invoice.client.name}
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 11, color: '#a1a1aa', margin: '0 0 2px' }}>
                  Issue date
                </Text>
                <Text style={{ fontSize: 14, color: '#18181b', margin: 0 }}>
                  {invoice.issueDate.toLocaleDateString('en-GB')}
                </Text>
                {invoice.dueDate && (
                  <>
                    <Text style={{ fontSize: 11, color: '#a1a1aa', margin: '8px 0 2px' }}>
                      Due date
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', margin: 0 }}>
                      {invoice.dueDate.toLocaleDateString('en-GB')}
                    </Text>
                  </>
                )}
              </Column>
            </Row>
          </Section>

          {/* Line items */}
          <Section style={{ padding: '24px 32px' }}>
            <Text
              style={{
                fontSize: 11,
                color: '#a1a1aa',
                textTransform: 'uppercase',
                letterSpacing: 1,
                margin: '0 0 12px',
              }}
            >
              Items
            </Text>
            {/* Table header */}
            <Row style={{ backgroundColor: '#f4f4f5', padding: '8px 0', borderRadius: 4 }}>
              <Column style={{ width: '60%', paddingLeft: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#71717a', margin: 0 }}>
                  Description
                </Text>
              </Column>
              <Column style={{ width: '10%', textAlign: 'right' }}>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#71717a', margin: 0 }}>
                  Qty
                </Text>
              </Column>
              <Column style={{ width: '15%', textAlign: 'right' }}>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#71717a', margin: 0 }}>
                  Unit
                </Text>
              </Column>
              <Column style={{ width: '15%', textAlign: 'right', paddingRight: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: 600, color: '#71717a', margin: 0 }}>
                  Total
                </Text>
              </Column>
            </Row>
            {invoice.items.map((item, i) => (
              <Row key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f4f4f5' }}>
                <Column style={{ width: '60%', paddingLeft: 8 }}>
                  <Text style={{ fontSize: 13, color: '#3f3f46', margin: 0 }}>
                    {item.description}
                  </Text>
                </Column>
                <Column style={{ width: '10%', textAlign: 'right' }}>
                  <Text style={{ fontSize: 13, color: '#3f3f46', margin: 0 }}>{item.quantity}</Text>
                </Column>
                <Column style={{ width: '15%', textAlign: 'right' }}>
                  <Text style={{ fontSize: 13, color: '#3f3f46', margin: 0 }}>
                    {fmt(item.unitPriceCents)}
                  </Text>
                </Column>
                <Column style={{ width: '15%', textAlign: 'right', paddingRight: 8 }}>
                  <Text style={{ fontSize: 13, color: '#18181b', fontWeight: 600, margin: 0 }}>
                    {fmt(item.totalCents)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Totals */}
          <Section style={{ padding: '0 32px 24px', textAlign: 'right' }}>
            <Row>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 13, color: '#71717a', margin: '0 0 4px' }}>
                  Subtotal: {fmt(invoice.subtotalCents)}
                </Text>
                {invoice.taxRateBps > 0 && (
                  <Text style={{ fontSize: 13, color: '#71717a', margin: '0 0 4px' }}>
                    VAT ({taxPct}%): {fmt(invoice.taxCents)}
                  </Text>
                )}
                <Hr style={{ borderColor: '#e4e4e7', margin: '12px 0' }} />
                <Text style={{ fontSize: 18, fontWeight: 700, color: '#6366f1', margin: 0 }}>
                  Total: {fmt(invoice.totalCents)}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Notes */}
          {invoice.notes && (
            <Section style={{ padding: '0 32px 24px' }}>
              <div style={{ backgroundColor: '#f4f4f5', borderRadius: 6, padding: '12px 16px' }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: '#a1a1aa',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    margin: '0 0 6px',
                  }}
                >
                  Payment instructions
                </Text>
                <Text style={{ fontSize: 13, color: '#3f3f46', margin: 0, whiteSpace: 'pre-line' }}>
                  {invoice.notes}
                </Text>
              </div>
            </Section>
          )}

          {/* Footer */}
          <Section
            style={{ backgroundColor: '#f4f4f5', padding: '16px 32px', textAlign: 'center' }}
          >
            <Text style={{ fontSize: 11, color: '#a1a1aa', margin: 0 }}>
              The invoice PDF is attached to this email. · Generated by SilkRoute OS
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
