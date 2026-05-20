import { z } from 'zod';

// System prompt — versioned, passed verbatim to the model.
export const DASHBOARD_INSIGHTS_SYSTEM_PROMPT =
  `You are SilkRoute OS's business intelligence assistant for import/export organisations.
Analyse the organisation's recent sourcing data and surface 2–3 concise, actionable insights.
Focus areas: supplier reliability (late deliveries, risk scores), order pipeline health, margin opportunities, and cash-flow risks.
Be specific — reference supplier names, order numbers, and amounts when available.
Each insight must be actionable, not just descriptive.
Respond only via the provided tool — never in plain prose.` as const;

// ─── Output schema ────────────────────────────────────────────────────────────

export const InsightSchema = z.object({
  id: z.string().describe('Unique slug, e.g. "supplier-late-orders"'),
  type: z.enum(['warning', 'opportunity', 'info']),
  title: z.string().max(80).describe('Short headline (≤80 chars)'),
  body: z.string().max(240).describe('Actionable detail (≤240 chars)'),
  entityType: z.enum(['supplier', 'order', 'invoice', 'general']).optional(),
  entityId: z.string().optional().describe('Local DB id of the referenced entity'),
  entityLabel: z.string().optional().describe('Human-readable name, e.g. "Shenzhen Tech Co."'),
  ctaLabel: z.string().optional().describe('Short CTA button text, e.g. "Review supplier"'),
  ctaHref: z.string().optional().describe('Relative URL for the CTA'),
});

export const InsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).min(2).max(3),
  generatedAt: z.string().datetime(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type Insight = z.infer<typeof InsightSchema>;
export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;

// ─── Tool definition (for real Anthropic structured-output call) ──────────────
// TODO(ai): replace mock with real Anthropic call once API key is funded.
// The real implementation should follow the Zod schema above, passed via
// tool_use with this definition so Claude returns validated JSON.

export const INSIGHTS_TOOL_DEFINITION = {
  name: 'report_dashboard_insights',
  description: 'Report 2–3 actionable dashboard insights derived from the organisation data.',
  input_schema: {
    type: 'object' as const,
    properties: {
      insights: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'type', 'title', 'body'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['warning', 'opportunity', 'info'] },
            title: { type: 'string' },
            body: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            entityLabel: { type: 'string' },
            ctaLabel: { type: 'string' },
            ctaHref: { type: 'string' },
          },
        },
        minItems: 2,
        maxItems: 3,
      },
      generatedAt: { type: 'string', format: 'date-time' },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    required: ['insights', 'generatedAt', 'confidence'],
  },
} as const;
