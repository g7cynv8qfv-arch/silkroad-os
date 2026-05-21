import { db } from '@/lib/db';
import type { IntelligenceReportFull, ReportListItem } from './types';
import type { RedFlag, Opportunity, IntelligenceAnalysisOutput } from './schemas';

export async function listIntelligenceReports(orgId: string): Promise<ReportListItem[]> {
  const rows = await db.intelligenceReport.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      sourceType: true,
      sourceRef: true,
      riskScore: true,
      credibilityScore: true,
      qualitySignal: true,
      model: true,
      createdAt: true,
      supplier: { select: { id: true, name: true } },
    },
  });

  return rows as ReportListItem[];
}

export async function getIntelligenceReport(
  id: string,
  orgId: string,
): Promise<IntelligenceReportFull | null> {
  const row = await db.intelligenceReport.findFirst({
    where: { id, organizationId: orgId },
    include: { supplier: { select: { id: true, name: true } } },
  });

  if (!row) return null;

  return {
    ...row,
    redFlags: row.redFlags as unknown as RedFlag[],
    opportunities: row.opportunities as unknown as Opportunity[],
    rawAnalysis: row.rawAnalysis as unknown as IntelligenceAnalysisOutput,
  };
}

export async function listSupplierNamesForAutocomplete(
  orgId: string,
): Promise<{ id: string; name: string }[]> {
  return db.supplier.findMany({
    where: { organizationId: orgId, status: 'ACTIVE' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 200,
  });
}
