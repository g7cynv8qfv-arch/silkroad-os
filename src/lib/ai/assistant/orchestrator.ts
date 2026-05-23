// TODO(ai): replace keyword matcher with Claude Sonnet 4.6 + tool use.
// Tools are already implemented and ready.

import { querySuppliers, queryOrders, queryInvoices, computeKpi } from './tools';

export interface ToolCallRecord {
  name: string;
  result: unknown;
}

export interface OrchestratorResult {
  text: string;
  toolCalls: ToolCallRecord[];
}

function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export async function runMockOrchestrator(
  message: string,
  orgId: string,
): Promise<OrchestratorResult> {
  const msg = message.toLowerCase();
  const toolCalls: ToolCallRecord[] = [];

  // ── Riskiest / risk score supplier ────────────────────────────────────────
  if (
    (msg.includes('risk') || msg.includes('riskiest') || msg.includes('dangerous')) &&
    (msg.includes('supplier') ||
      msg.includes('vendor') ||
      msg.includes('highest') ||
      msg.includes('which'))
  ) {
    const suppliers = await querySuppliers(orgId, { limit: 5 });
    toolCalls.push({ name: 'query_suppliers', result: suppliers });

    if (suppliers.length === 0) {
      return {
        text: 'You have no suppliers in the system yet. Add your first supplier to start tracking risk scores.',
        toolCalls,
      };
    }

    const top = suppliers[0];
    if (!top) return { text: 'No supplier data available.', toolCalls };
    const score = top.riskScore !== null ? top.riskScore.toFixed(1) : 'N/A';
    let text = `**${top.name}** has the highest risk score at **${score}/10**`;
    if (top.country) text += ` (${top.country})`;
    text += '.';

    if (suppliers.length > 1) {
      text += '\n\nTop suppliers by risk score:\n';
      suppliers.forEach((s, i) => {
        const sc = s.riskScore !== null ? s.riskScore.toFixed(1) : 'N/A';
        text += `${i + 1}. **${s.name}** — ${sc}/10\n`;
      });
    }

    return { text, toolCalls };
  }

  // ── Revenue / sales KPI ───────────────────────────────────────────────────
  if (
    msg.includes('revenue') ||
    msg.includes('sales') ||
    (msg.includes('earn') && msg.includes('month')) ||
    (msg.includes('made') && msg.includes('month'))
  ) {
    const period = msg.includes('last month') ? 'last_month' : 'this_month';
    const kpi = await computeKpi(orgId, 'revenue', period);
    toolCalls.push({ name: 'compute_kpi', result: kpi });

    const label = period === 'this_month' ? 'this month' : 'last month';
    const text =
      kpi.valueCents === 0
        ? `No revenue recorded ${label}. Make sure invoices are marked as Sent or Paid.`
        : `Total revenue **${label}**: **${kpi.valueFormatted}**.`;
    return { text, toolCalls };
  }

  // ── Margin ────────────────────────────────────────────────────────────────
  if (msg.includes('margin')) {
    const period = msg.includes('last month') ? 'last_month' : 'this_month';
    const kpi = await computeKpi(orgId, 'margin', period);
    toolCalls.push({ name: 'compute_kpi', result: kpi });

    const label = period === 'this_month' ? 'this month' : 'last month';
    const text =
      kpi.valueCents === 0
        ? `No delivered orders with margin data found ${label}.`
        : `Average margin **${label}**: **${kpi.valueFormatted}**.`;
    return { text, toolCalls };
  }

  // ── Late / overdue / delayed orders ───────────────────────────────────────
  if (
    (msg.includes('late') ||
      msg.includes('delayed') ||
      msg.includes('overdue') ||
      msg.includes('past due')) &&
    (msg.includes('order') || msg.includes('deliver') || msg.includes('shipment'))
  ) {
    const orders = await queryOrders(orgId, { late: true });
    toolCalls.push({ name: 'query_orders', result: orders });

    if (orders.length === 0) {
      return {
        text: 'No orders are currently overdue. All deliveries are on schedule.',
        toolCalls,
      };
    }

    let text = `**${orders.length} order${orders.length > 1 ? 's are' : ' is'} past the expected delivery date:**\n\n`;
    orders.slice(0, 5).forEach((o) => {
      const supplier = o.supplier?.name ?? 'Unknown supplier';
      const due = o.expectedDeliveryAt
        ? new Date(o.expectedDeliveryAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'No date set';
      text += `- **${o.orderNumber}** from ${supplier} — expected ${due} (${o.status})\n`;
    });
    if (orders.length > 5) text += `\n…and ${orders.length - 5} more.`;
    return { text, toolCalls };
  }

  // ── Invoices ──────────────────────────────────────────────────────────────
  if (
    msg.includes('invoice') ||
    msg.includes('billing') ||
    msg.includes('payment') ||
    msg.includes('unpaid')
  ) {
    const period = msg.includes('this month')
      ? 'this_month'
      : msg.includes('last month')
        ? 'last_month'
        : undefined;
    const invoices = await queryInvoices(orgId, { period });
    toolCalls.push({ name: 'query_invoices', result: invoices });

    if (invoices.length === 0) {
      return {
        text: 'No invoices found. Create your first invoice under **Invoices → New invoice**.',
        toolCalls,
      };
    }

    const total = invoices.reduce((s, inv) => s + inv.totalCents, 0);
    const paid = invoices.filter((i) => i.status === 'PAID').length;
    const overdue = invoices.filter((i) => i.status === 'OVERDUE').length;
    const periodLabel =
      period === 'this_month' ? ' this month' : period === 'last_month' ? ' last month' : '';

    let text = `**${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}**${periodLabel}.`;
    text += `\n\n- Total value: **${formatCents(total)}**`;
    text += `\n- Paid: **${paid}**`;
    text += `\n- Overdue: **${overdue}**`;
    return { text, toolCalls };
  }

  // ── Suppliers (general) ───────────────────────────────────────────────────
  if (
    msg.includes('supplier') ||
    msg.includes('vendor') ||
    msg.includes('sourcing') ||
    msg.includes('how many supplier')
  ) {
    const suppliers = await querySuppliers(orgId, { limit: 10 });
    toolCalls.push({ name: 'query_suppliers', result: suppliers });

    if (suppliers.length === 0) {
      return {
        text: 'No suppliers yet. Go to **Suppliers → New supplier** to add your first one.',
        toolCalls,
      };
    }

    const active = suppliers.filter((s) => s.status === 'ACTIVE').length;
    let text = `You have **${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''}** (${active} active).`;
    const topRisk = suppliers.find((s) => s.riskScore !== null);
    if (topRisk) {
      text += ` Highest risk: **${topRisk.name}** (${topRisk.riskScore?.toFixed(1)}/10).`;
    }
    return { text, toolCalls };
  }

  // ── Orders (general) ─────────────────────────────────────────────────────
  if (msg.includes('order') || msg.includes('purchase order') || msg.includes('po ')) {
    const orders = await queryOrders(orgId);
    toolCalls.push({ name: 'query_orders', result: orders });

    if (orders.length === 0) {
      return {
        text: 'No orders found. Go to **Orders → New order** to create your first purchase order.',
        toolCalls,
      };
    }

    const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    let text = `**${orders.length} recent order${orders.length !== 1 ? 's' : ''}.**\n\nBreakdown by status:\n`;
    Object.entries(byStatus).forEach(([status, count]) => {
      text += `- ${status.replace('_', ' ')}: ${count}\n`;
    });
    return { text, toolCalls };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    text: 'I can answer questions about your suppliers, orders, invoices, and financial KPIs.\n\nTry:\n- "Which supplier has the highest risk score?"\n- "What\'s my revenue this month?"\n- "Do I have any late orders?"\n- "Show me my recent invoices"',
    toolCalls: [],
  };
}
