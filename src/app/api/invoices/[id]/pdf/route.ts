import { type NextRequest, NextResponse } from 'next/server';
import { getCurrentOrg } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { orgId } = await getCurrentOrg();
    const invoice = await db.invoice.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: {
        client: true,
        items: { orderBy: { createdAt: 'asc' } },
        organization: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { renderInvoicePdf } = await import('@/lib/pdf/render');
    const buffer = await renderInvoicePdf(invoice);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
