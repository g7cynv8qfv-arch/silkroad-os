import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { flagOverdueInvoices } from '@/inngest/functions/flag-overdue-invoices';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [flagOverdueInvoices],
});
