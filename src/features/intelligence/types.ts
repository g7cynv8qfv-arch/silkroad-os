import type { IntelligenceReport, Supplier } from '@prisma/client';
import type { RedFlag, Opportunity, IntelligenceAnalysisOutput } from './schemas';

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

// IntelligenceReport with typed JSON fields
export type IntelligenceReportFull = Omit<
  IntelligenceReport,
  'redFlags' | 'opportunities' | 'rawAnalysis'
> & {
  redFlags: RedFlag[];
  opportunities: Opportunity[];
  rawAnalysis: IntelligenceAnalysisOutput;
  supplier: Pick<Supplier, 'id' | 'name'> | null;
};

export type ReportListItem = Pick<
  IntelligenceReport,
  | 'id'
  | 'sourceType'
  | 'sourceRef'
  | 'riskScore'
  | 'credibilityScore'
  | 'qualitySignal'
  | 'model'
  | 'createdAt'
> & {
  supplier: Pick<Supplier, 'id' | 'name'> | null;
};
