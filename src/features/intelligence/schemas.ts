import { z } from 'zod';

export const confidenceSchema = z.enum(['low', 'medium', 'high']);

export const supplierRiskScoreSchema = z.object({
  supplierId: z.string(),
  score: z.number().min(0).max(10),
  confidence: confidenceSchema,
  reasoning: z.string(),
  generatedAt: z.date(),
});

export type Confidence = z.infer<typeof confidenceSchema>;
export type SupplierRiskScore = z.infer<typeof supplierRiskScoreSchema>;
