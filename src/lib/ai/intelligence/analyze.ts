// TODO(ai): replace mock with real Anthropic call once API key is funded.
// The real implementation should follow the system prompt in
// src/lib/ai/prompts/supplier-intelligence.v1.ts and use tool use
// for structured output matching IntelligenceReportSchema.
//
// Real implementation sketch:
//   import { anthropic, MODELS } from '@/lib/ai';
//   import { SUPPLIER_INTELLIGENCE_SYSTEM_PROMPT, SUPPLIER_INTELLIGENCE_TOOL } from '@/lib/ai/prompts/supplier-intelligence.v1';
//   const response = await anthropic.messages.create({
//     model: MODELS.reasoning,
//     max_tokens: 4096,
//     system: SUPPLIER_INTELLIGENCE_SYSTEM_PROMPT,
//     tools: [SUPPLIER_INTELLIGENCE_TOOL],
//     tool_choice: { type: 'tool', name: 'report_supplier_intelligence' },
//     messages: [{ role: 'user', content: buildUserMessage(extracted, locale) }],
//   });

import type { ExtractResult } from './extract';
import {
  intelligenceAnalysisOutputSchema,
  type IntelligenceAnalysisOutput,
} from '@/features/intelligence/schemas';

const MOCK_MODEL = 'claude-sonnet-4-6-mock';

// Deterministic seeded variation: maps a string to a float in [0, 1).
function seededFloat(seed: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash % 1000) / 1000;
}

function lerp(min: number, max: number, t: number): number {
  return Math.round((min + (max - min) * t) * 10) / 10;
}

type MockProfile = {
  riskRange: [number, number];
  credRange: [number, number];
  qualRange: [number, number];
  riskConfidence: 'low' | 'medium' | 'high';
  credConfidence: 'low' | 'medium' | 'high';
  qualConfidence: 'low' | 'medium' | 'high';
  redFlagCount: number;
  opportunityCount: number;
};

function pickProfile(kind: ExtractResult['profile']['kind']): MockProfile {
  switch (kind) {
    case 'alibaba_url':
      return {
        riskRange: [4.5, 6.5],
        credRange: [5.5, 7.5],
        qualRange: [5.0, 7.0],
        riskConfidence: 'medium',
        credConfidence: 'medium',
        qualConfidence: 'medium',
        redFlagCount: 2,
        opportunityCount: 2,
      };
    case 'url_1688':
      return {
        riskRange: [5.5, 8.0],
        credRange: [3.5, 5.5],
        qualRange: [4.0, 6.0],
        riskConfidence: 'high',
        credConfidence: 'medium',
        qualConfidence: 'low',
        redFlagCount: 4,
        opportunityCount: 1,
      };
    case 'pdf':
      return {
        riskRange: [1.5, 3.5],
        credRange: [7.0, 9.0],
        qualRange: [7.0, 9.0],
        riskConfidence: 'high',
        credConfidence: 'high',
        qualConfidence: 'high',
        redFlagCount: 0,
        opportunityCount: 3,
      };
    case 'image':
      return {
        riskRange: [3.0, 7.0],
        credRange: [4.0, 8.0],
        qualRange: [4.0, 8.0],
        riskConfidence: 'low',
        credConfidence: 'low',
        qualConfidence: 'low',
        redFlagCount: 2,
        opportunityCount: 2,
      };
    case 'generic_url':
    case 'manual':
    default:
      return {
        riskRange: [2.5, 5.5],
        credRange: [5.0, 7.5],
        qualRange: [4.5, 7.0],
        riskConfidence: 'medium',
        credConfidence: 'medium',
        qualConfidence: 'medium',
        redFlagCount: 1,
        opportunityCount: 2,
      };
  }
}

const RED_FLAGS_POOL = [
  {
    severity: 'medium' as const,
    title: 'Unverified certification claims',
    description:
      'ISO 9001 certificate listed without a certifying body name or certificate number. Cannot be independently validated.',
  },
  {
    severity: 'medium' as const,
    title: 'Stock photos in product listings',
    description:
      'Several product images appear to be stock or vendor-supplied photos rather than actual factory production shots.',
  },
  {
    severity: 'high' as const,
    title: 'Inconsistent company name',
    description:
      'The company name differs between the storefront, the about page, and the business license preview — a common indicator of a trading company masquerading as a factory.',
  },
  {
    severity: 'high' as const,
    title: 'Pricing significantly below market',
    description:
      'Unit prices quoted are 35–50% below the estimated industry floor for this category. Possible bait-and-switch or severe quality compromise.',
  },
  {
    severity: 'low' as const,
    title: 'Limited transaction history',
    description:
      'Fewer than 5 verified transactions on the platform. Insufficient track record to assess reliability.',
  },
  {
    severity: 'critical' as const,
    title: 'Trade assurance coverage suspiciously low',
    description:
      'Trade Assurance coverage is set at $500 while the claimed annual export volume is $2M+. This mismatch suggests the coverage figure is decorative.',
  },
  {
    severity: 'medium' as const,
    title: 'Copy-pasted product descriptions',
    description:
      'Multiple product listings use identical descriptions with only the model number swapped — a signal of catalog reselling rather than original manufacturing.',
  },
  {
    severity: 'high' as const,
    title: 'No visible factory address',
    description:
      'No factory address or Google Maps listing could be verified. The registered address resolves to a commercial park known to host virtual offices.',
  },
];

const OPPORTUNITIES_POOL = [
  {
    title: 'CE and RoHS compliant products',
    description:
      'Products appear CE and RoHS certified for EU market entry, reducing your compliance burden significantly.',
  },
  {
    title: 'Flexible MOQ options',
    description:
      'Minimum order quantities start at 100 units — unusually low for the category. Good fit for FBA sellers testing new SKUs.',
  },
  {
    title: 'OEM / ODM capability',
    description:
      'Supplier explicitly offers OEM and ODM services with in-house design team. Allows custom branding without a separate design agency.',
  },
  {
    title: 'Established export track record',
    description:
      'Verified exports to US, EU, and AU markets over 5+ years. Experienced with customs documentation and container loading.',
  },
  {
    title: 'Fast sample turnaround',
    description:
      'Sample lead time quoted at 5–7 days, which is best-in-class for the category. Allows rapid product validation.',
  },
  {
    title: 'In-house QC laboratory',
    description:
      'Supplier claims an in-house testing lab for key product categories. If verified on-site, this significantly reduces third-party QC costs.',
  },
];

function buildMockAnalysis(
  profile: MockProfile,
  seed: string,
  kind: ExtractResult['profile']['kind'],
  locale: string,
): IntelligenceAnalysisOutput {
  const r = (salt: number) => seededFloat(seed, salt);

  const riskVal = lerp(profile.riskRange[0], profile.riskRange[1], r(1));
  const credVal = lerp(profile.credRange[0], profile.credRange[1], r(2));
  const qualVal = lerp(profile.qualRange[0], profile.qualRange[1], r(3));

  const flagIndices = Array.from({ length: profile.redFlagCount }, (_, i) =>
    Math.floor(r(10 + i) * RED_FLAGS_POOL.length),
  );
  const redFlags = [...new Set(flagIndices)]
    .slice(0, profile.redFlagCount)
    .map((idx) => RED_FLAGS_POOL[idx % RED_FLAGS_POOL.length] ?? RED_FLAGS_POOL[0] ?? '');

  const oppIndices = Array.from({ length: profile.opportunityCount }, (_, i) =>
    Math.floor(r(20 + i) * OPPORTUNITIES_POOL.length),
  );
  const opportunities = [...new Set(oppIndices)]
    .slice(0, profile.opportunityCount)
    .map(
      (idx) => OPPORTUNITIES_POOL[idx % OPPORTUNITIES_POOL.length] ?? OPPORTUNITIES_POOL[0] ?? '',
    );

  const certPool = [
    'ISO 9001:2015',
    'CE',
    'RoHS',
    'BSCI',
    'FDA',
    'SGS',
    'Bureau Veritas',
    'Intertek',
  ];
  const certCount = Math.floor(r(30) * 3) + 1;
  const certifications = Array.from(
    { length: certCount },
    (_, i) => certPool[Math.floor(r(40 + i) * certPool.length) % certPool.length],
  ).filter((c): c is string => Boolean(c));

  const yearsInBusiness = Math.floor(r(50) * 15) + 3;
  const employeeRanges = ['10–49', '50–99', '100–299', '300–999', '1000+'];
  const employeeCount = employeeRanges[Math.floor(r(60) * employeeRanges.length)] ?? '50–99';

  const locations = [
    'Guangdong, Shenzhen',
    'Guangdong, Dongguan',
    'Zhejiang, Yiwu',
    'Zhejiang, Ningbo',
    'Fujian, Quanzhou',
    'Jiangsu, Suzhou',
    'Shanghai',
  ];
  const location = locations[Math.floor(r(70) * locations.length)] ?? 'Guangdong, Shenzhen';

  const isFr = locale === 'fr';

  const summaryAlibaba = isFr
    ? `Ce fournisseur Alibaba présente un profil de risque modéré (${riskVal}/10). Bien qu'il affiche plusieurs années d'activité et quelques certifications, plusieurs signaux méritent attention avant toute commande significative. La vérification indépendante des certifications et une visite d'usine (physique ou virtuelle) sont recommandées.\n\nLa crédibilité globale est évaluée à ${credVal}/10 — correcte pour ce segment de marché, mais insuffisante pour un fournisseur stratégique sans audit préalable. Les signaux qualité (${qualVal}/10) suggèrent des capacités acceptables pour des produits d'entrée et milieu de gamme.\n\nRecommandation : commencer par un échantillon de 3–5 SKUs, exiger les certificats originaux par voie officielle, et planifier une visite d'inspection avant toute commande supérieure à $5 000.`
    : `This Alibaba supplier presents a moderate risk profile (${riskVal}/10). While it displays several years of activity and some certifications, several signals warrant attention before any significant order. Independent certification verification and a factory visit (physical or virtual) are recommended.\n\nOverall credibility is rated ${credVal}/10 — acceptable for this market segment but insufficient for a strategic supplier without a prior audit. Quality signals (${qualVal}/10) suggest adequate capabilities for entry- and mid-range products.\n\nRecommendation: start with a 3–5 SKU sample, request original certificates through official channels, and schedule an inspection visit before any order above $5,000.`;

  const summary1688 = isFr
    ? `Ce fournisseur 1688.com présente un profil de risque élevé (${riskVal}/10) et une crédibilité limitée (${credVal}/10). La plateforme 1688 est principalement destinée au marché intérieur chinois, ce qui génère des risques supplémentaires pour les acheteurs internationaux : barrières linguistiques, absence de protection Trade Assurance, et recours limité en cas de litige.\n\nPlusieurs incohérences ont été détectées entre les différentes sections du profil fournisseur. Les signaux qualité (${qualVal}/10) restent insuffisants pour justifier une relation fournisseur sans investigation approfondie sur place.\n\nRecommandation : utiliser ce fournisseur uniquement comme référence de prix ou point de départ pour identifier des fabricants comparables sur Alibaba. Ne pas passer de commande sans avoir effectué un audit complet via un prestataire local.`
    : `This 1688.com supplier carries a high risk profile (${riskVal}/10) and limited credibility (${credVal}/10). The 1688 platform is primarily designed for the domestic Chinese market, creating additional risks for international buyers: language barriers, no Trade Assurance protection, and limited recourse in disputes.\n\nMultiple inconsistencies were detected across different sections of the supplier profile. Quality signals (${qualVal}/10) are insufficient to justify a supplier relationship without in-depth on-site investigation.\n\nRecommendation: use this supplier only as a price reference or starting point to identify comparable manufacturers on Alibaba. Do not place any order without a full audit through a local sourcing agent.`;

  const summaryPdf = isFr
    ? `L'analyse de ce catalogue PDF révèle un fournisseur solide avec un faible risque (${riskVal}/10) et une crédibilité élevée (${credVal}/10). La documentation fournie est professionnelle, cohérente et inclut des certifications vérifiables.\n\nLes signaux qualité sont excellents (${qualVal}/10) : les spécifications techniques sont précises, les images semblent authentiques, et les certifications correspondent aux standards internationaux applicables à cette catégorie de produits.\n\nRecommandation : ce fournisseur mérite une demande de devis formelle. Vérifier les certifications en contactant directement l'organisme certificateur, puis programmer un appel de présentation avec l'équipe commerciale.`
    : `Analysis of this PDF catalog reveals a solid supplier with low risk (${riskVal}/10) and high credibility (${credVal}/10). The documentation provided is professional, consistent, and includes verifiable certifications.\n\nQuality signals are excellent (${qualVal}/10): technical specifications are precise, images appear authentic, and certifications match applicable international standards for this product category.\n\nRecommendation: this supplier merits a formal RFQ. Verify certifications by contacting the certifying body directly, then schedule an introductory call with the sales team.`;

  const summaryGeneric = isFr
    ? `L'analyse de cette source révèle un profil fournisseur avec un niveau de risque modéré (${riskVal}/10) et une crédibilité satisfaisante (${credVal}/10). Les informations disponibles permettent une évaluation préliminaire, mais des données complémentaires seraient nécessaires pour une analyse complète.\n\nLes signaux qualité (${qualVal}/10) indiquent un potentiel raisonnable pour cette catégorie de produits. Un approfondissement de la due diligence est recommandé avant tout engagement commercial.\n\nRecommandation : demander une liste de références clients vérifiables et des échantillons avant toute décision d'achat significative.`
    : `Analysis of this source reveals a supplier profile with moderate risk level (${riskVal}/10) and satisfactory credibility (${credVal}/10). Available information allows a preliminary assessment, but additional data would be needed for a complete analysis.\n\nQuality signals (${qualVal}/10) indicate reasonable potential for this product category. Enhanced due diligence is recommended before any commercial commitment.\n\nRecommendation: request a list of verifiable client references and samples before any significant purchase decision.`;

  const summaryMap: Record<ExtractResult['profile']['kind'], string> = {
    alibaba_url: summaryAlibaba,
    url_1688: summary1688,
    pdf: summaryPdf,
    image: summaryGeneric,
    generic_url: summaryGeneric,
    manual: summaryGeneric,
  };

  const inconsistencies =
    redFlags.length > 1
      ? [
          'Company registration year on business license differs from "established" date on storefront by 3 years.',
          'Export volume claimed ($4.5M/year) is inconsistent with the stated employee count (12 staff).',
        ].slice(0, Math.floor(r(80) * 2) + (redFlags.length > 2 ? 2 : 1))
      : [];

  const pricingAnalysis =
    kind !== 'manual'
      ? `Pricing observed is ${riskVal > 5 ? 'below' : 'in line with'} market median for this category. MOQ structure suggests ${credVal > 6 ? 'manufacturing capability' : 'trading company model'}. Currency risk is USD-denominated with standard 30% deposit / 70% on BL terms.`
      : undefined;

  const communicationSignals =
    kind === 'alibaba_url' || kind === 'url_1688'
      ? `Response time on platform: estimated ${Math.floor(r(90) * 12) + 1}h. Listing copy quality: ${credVal > 6 ? 'professional, original content' : 'partially copy-pasted from category templates'}.`
      : undefined;

  const tokensIn = 2000 + Math.floor(r(91) * 2000);
  const tokensOut = 500 + Math.floor(r(92) * 1000);

  return intelligenceAnalysisOutputSchema.parse({
    companyInfo: {
      name:
        kind === 'manual'
          ? undefined
          : `${location.split(',')[1]?.trim() ?? 'Shenzhen'} Industrial Co., Ltd.`,
      yearsInBusiness,
      location,
      employeeCount,
      certifications,
      capacityClaims:
        kind !== 'manual'
          ? `Annual capacity: ${Math.floor(r(95) * 90 + 10) * 1000} units/year`
          : undefined,
      contactDetails:
        kind === 'alibaba_url' || kind === 'url_1688'
          ? `Trade Manager: ${['Jenny', 'Lily', 'Grace', 'Amy', 'Kevin'][Math.floor(r(96) * 5)] ?? 'Jenny'} · WeChat: supplier_${Math.floor(r(97) * 9000 + 1000)}`
          : undefined,
    },
    riskScore: {
      value: riskVal,
      confidence: profile.riskConfidence,
      reasoning: `Risk score derived from ${redFlags.length} identified flags, certification verification status, and platform history analysis.`,
    },
    credibilityScore: {
      value: credVal,
      confidence: profile.credConfidence,
      reasoning: `Credibility based on documentation quality, consistency of information, and verifiable trade history.`,
    },
    qualitySignal: {
      value: qualVal,
      confidence: profile.qualConfidence,
      reasoning: `Quality signals assessed from certification claims, product specification depth, and production capacity claims.`,
    },
    summary: summaryMap[kind] ?? summaryGeneric,
    redFlags,
    opportunities,
    pricingAnalysis,
    communicationSignals,
    inconsistencies,
    model: MOCK_MODEL,
    inputTokens: tokensIn,
    outputTokens: tokensOut,
    latencyMs: 1800 + Math.floor(r(99) * 600),
  });
}

export async function analyzeSupplier(
  extracted: ExtractResult,
  locale: string = 'en',
): Promise<IntelligenceAnalysisOutput> {
  const start = Date.now();

  // Simulate network + processing latency
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const profile = pickProfile(extracted.profile.kind);
  const seed = extracted.extractedText.slice(0, 200);
  const result = buildMockAnalysis(profile, seed, extracted.profile.kind, locale);

  return {
    ...result,
    latencyMs: Date.now() - start,
  };
}
