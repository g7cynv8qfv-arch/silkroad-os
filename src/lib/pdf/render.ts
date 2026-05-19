import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePdfDocument } from './InvoicePdf';
import type { ComponentProps } from 'react';

type InvoicePdfProps = ComponentProps<typeof InvoicePdfDocument>['invoice'];

export async function renderInvoicePdf(invoice: InvoicePdfProps): Promise<Buffer> {
  const element = React.createElement(InvoicePdfDocument, { invoice });
  const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
