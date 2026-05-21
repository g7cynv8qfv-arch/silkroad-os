import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────────────────────

export const confidenceSchema = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof confidenceSchema>;

export const severitySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type Severity = z.infer<typeof severitySchema>;

export const scoreWithConfidenceSchema = z.object({
  value: z.number().min(0).max(10),
  confidence: confidenceSchema,
  reasoning: z.string(),
});
export type ScoreWithConfidence = z.infer<typeof scoreWithConfidenceSchema>;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const redFlagSchema = z.object({
  severity: severitySchema,
  title: z.string(),
  description: z.string(),
});
export type RedFlag = z.infer<typeof redFlagSchema>;

export const opportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
});
export type Opportunity = z.infer<typeof opportunitySchema>;

export const companyInfoSchema = z.object({
  name: z.string().optional(),
  yearsInBusiness: z.number().int().nonnegative().optional(),
  location: z.string().optional(),
  employeeCount: z.string().optional(),
  certifications: z.array(z.string()),
  capacityClaims: z.string().optional(),
  contactDetails: z.string().optional(),
});
export type CompanyInfo = z.infer<typeof companyInfoSchema>;

// ─── AI structured output ─────────────────────────────────────────────────────
// This is what the analyze step returns (real or mock).
// Validated with Zod before persisting.

export const intelligenceAnalysisOutputSchema = z.object({
  companyInfo: companyInfoSchema,
  riskScore: scoreWithConfidenceSchema,
  credibilityScore: scoreWithConfidenceSchema,
  qualitySignal: scoreWithConfidenceSchema,
  summary: z.string().min(1),
  redFlags: z.array(redFlagSchema),
  opportunities: z.array(opportunitySchema),
  pricingAnalysis: z.string().optional(),
  communicationSignals: z.string().optional(),
  inconsistencies: z.array(z.string()),
  model: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
});
export type IntelligenceAnalysisOutput = z.infer<typeof intelligenceAnalysisOutputSchema>;

// ─── Action input ─────────────────────────────────────────────────────────────

export const runAnalysisInputSchema = z.object({
  sourceType: z.enum(['URL', 'PDF', 'IMAGE', 'MANUAL']),
  sourceRef: z.string().min(1, 'Source is required').max(2000),
  supplierId: z.string().optional(),
  locale: z.enum(['en', 'fr']).default('en'),
});
export type RunAnalysisInput = z.infer<typeof runAnalysisInputSchema>;

export const attachToSupplierInputSchema = z.object({
  reportId: z.string().min(1),
  supplierId: z.string().min(1),
});
export type AttachToSupplierInput = z.infer<typeof attachToSupplierInputSchema>;
