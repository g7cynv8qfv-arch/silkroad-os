// Deterministic scoring layer applied on top of the AI analysis output.
// Penalizes critical red flags, caps scores when confidence is low.
// Returns the final scores to be persisted to the DB.

import type { IntelligenceAnalysisOutput } from '@/features/intelligence/schemas';

export type FinalScores = {
  riskScore: number;
  credibilityScore: number;
  qualitySignal: number;
};

const SEVERITY_PENALTIES: Record<string, number> = {
  low: 0,
  medium: 0.3,
  high: 0.7,
  critical: 1.5,
};

const CONFIDENCE_CAPS: Record<string, number> = {
  low: 0.4,
  medium: 0.8,
  high: 1.0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeFinalScores(analysis: IntelligenceAnalysisOutput): FinalScores {
  // Aggregate red flag penalty on risk score
  const totalPenalty = analysis.redFlags.reduce(
    (sum, flag) => sum + (SEVERITY_PENALTIES[flag.severity] ?? 0),
    0,
  );

  let riskScore = analysis.riskScore.value + totalPenalty;

  // Apply confidence cap: if confidence is low, regression toward 5 (neutral)
  const riskCap = CONFIDENCE_CAPS[analysis.riskScore.confidence] ?? 1.0;
  const credCap = CONFIDENCE_CAPS[analysis.credibilityScore.confidence] ?? 1.0;
  const qualCap = CONFIDENCE_CAPS[analysis.qualitySignal.confidence] ?? 1.0;

  riskScore = analysis.riskScore.value * riskCap + 5 * (1 - riskCap) + totalPenalty * riskCap;
  const credibilityScore = analysis.credibilityScore.value * credCap + 5 * (1 - credCap);
  const qualitySignal = analysis.qualitySignal.value * qualCap + 5 * (1 - qualCap);

  return {
    riskScore: round1(clamp(riskScore, 0, 10)),
    credibilityScore: round1(clamp(credibilityScore, 0, 10)),
    qualitySignal: round1(clamp(qualitySignal, 0, 10)),
  };
}
