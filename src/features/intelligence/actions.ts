'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireRole, getCurrentOrg } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { extractContent } from '@/lib/ai/intelligence/extract';
import { analyzeSupplier } from '@/lib/ai/intelligence/analyze';
import { computeFinalScores } from '@/lib/ai/intelligence/score';
import { runAnalysisInputSchema, attachToSupplierInputSchema } from './schemas';
import type { ActionResult } from './types';
import type { IntelligenceReportFull } from './types';

// ─── Run analysis ─────────────────────────────────────────────────────────────

export async function runIntelligenceAnalysis(
  rawInput: unknown,
): Promise<ActionResult<IntelligenceReportFull>> {
  const start = Date.now();
  try {
    const { orgId, userId } = await requireRole('MEMBER');
    const input = runAnalysisInputSchema.parse(rawInput);

    // Step 1: extract
    const extracted = await extractContent(input.sourceType, input.sourceRef);

    // Step 2: analyze (mock — see analyze.ts TODO block)
    let analysis;
    try {
      analysis = await analyzeSupplier(extracted, input.locale);
    } catch (aiErr) {
      logger.error({ aiErr }, 'intelligence.analyze failed');
      // Retry once with exponential backoff
      await new Promise((r) => setTimeout(r, 1000));
      try {
        analysis = await analyzeSupplier(extracted, input.locale);
      } catch (retryErr) {
        logger.error({ retryErr }, 'intelligence.analyze retry failed');
        throw new Error('AI analysis service is unavailable. Please try again in a few moments.');
      }
    }

    // Step 3: deterministic scoring layer
    const scores = computeFinalScores(analysis);
    const totalTokens = analysis.inputTokens + analysis.outputTokens;

    // Step 4: persist
    const report = await db.intelligenceReport.create({
      data: {
        organizationId: orgId,
        supplierId: input.supplierId ?? null,
        createdById: userId,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
        riskScore: scores.riskScore,
        credibilityScore: scores.credibilityScore,
        qualitySignal: scores.qualitySignal,
        summary: analysis.summary,
        redFlags: analysis.redFlags as object[],
        opportunities: analysis.opportunities as object[],
        rawAnalysis: analysis as object,
        model: analysis.model,
        tokensUsed: totalTokens,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });

    // Log AI call metadata
    await db.activityLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: 'intelligence.report_created',
        entityType: 'IntelligenceReport',
        entityId: report.id,
        metadata: {
          sourceType: input.sourceType,
          model: analysis.model,
          inputTokens: analysis.inputTokens,
          outputTokens: analysis.outputTokens,
          latencyMs: Date.now() - start,
          costUsd: estimateCost(analysis.model, analysis.inputTokens, analysis.outputTokens),
        },
      },
    });

    logger.info(
      { reportId: report.id, orgId, model: analysis.model, tokens: totalTokens },
      'intelligence.report_created',
    );

    revalidatePath('/intelligence');
    if (input.supplierId) revalidatePath(`/suppliers/${input.supplierId}`);

    return {
      success: true,
      data: {
        ...report,
        redFlags: analysis.redFlags,
        opportunities: analysis.opportunities,
        rawAnalysis: analysis,
      },
    };
  } catch (err) {
    logger.error({ err }, 'runIntelligenceAnalysis failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Attach to supplier ───────────────────────────────────────────────────────

export async function attachReportToSupplier(
  rawInput: unknown,
): Promise<ActionResult<{ supplierId: string }>> {
  try {
    const { orgId } = await requireRole('MEMBER');
    const input = attachToSupplierInputSchema.parse(rawInput);

    const [report, supplier] = await Promise.all([
      db.intelligenceReport.findFirst({ where: { id: input.reportId, organizationId: orgId } }),
      db.supplier.findFirst({ where: { id: input.supplierId, organizationId: orgId } }),
    ]);

    if (!report) return { success: false, error: 'Report not found.' };
    if (!supplier) return { success: false, error: 'Supplier not found.' };

    await db.$transaction([
      db.intelligenceReport.update({
        where: { id: input.reportId },
        data: { supplierId: input.supplierId },
      }),
      db.supplier.update({
        where: { id: input.supplierId },
        data: { riskScore: report.riskScore },
      }),
    ]);

    revalidatePath('/intelligence');
    revalidatePath(`/suppliers/${input.supplierId}`);

    return { success: true, data: { supplierId: input.supplierId } };
  } catch (err) {
    logger.error({ err }, 'attachReportToSupplier failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Delete report ────────────────────────────────────────────────────────────

export async function deleteIntelligenceReport(id: string): Promise<ActionResult> {
  try {
    const { orgId } = await requireRole('ADMIN');
    const report = await db.intelligenceReport.findFirst({ where: { id, organizationId: orgId } });
    if (!report) return { success: false, error: 'Report not found.' };
    await db.intelligenceReport.delete({ where: { id } });
    revalidatePath('/intelligence');
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ err }, 'deleteIntelligenceReport failed');
    return { success: false, error: (err as Error).message };
  }
}

// ─── Get report for PDF export ────────────────────────────────────────────────

export async function getReportForExport(id: string) {
  const { orgId } = await getCurrentOrg();
  return db.intelligenceReport.findFirst({
    where: { id, organizationId: orgId },
    include: {
      supplier: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

// ─── Cost estimation ──────────────────────────────────────────────────────────

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Pricing in USD per million tokens (Sonnet 4.6)
  if (model.includes('sonnet')) {
    return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  }
  if (model.includes('haiku')) {
    return (inputTokens * 0.25 + outputTokens * 1.25) / 1_000_000;
  }
  return 0;
}
