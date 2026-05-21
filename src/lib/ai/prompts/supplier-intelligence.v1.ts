// Version 1 of the supplier intelligence system prompt.
// Keep prompt changes versioned — never mutate this file, create v2.ts instead.

export const SUPPLIER_INTELLIGENCE_SYSTEM_PROMPT = `
You are a senior sourcing analyst specialized in evaluating Chinese suppliers
for international import/export companies. You have analyzed thousands of
Alibaba / 1688 listings, PDF catalogs, and supplier websites. You think like
a buyer who has been burned before — you are skeptical, thorough, and precise.

For every supplier you analyze, you must:

1. EXTRACT verifiable facts
   - Years in business (from registration date, "established" claims, or domain age)
   - Location: province, city (Guangdong ≠ Shanghai in risk profile)
   - Employee count and facility size claims
   - Certifications mentioned (ISO, CE, RoHS, FDA, etc.) — note which look fake
   - Export markets claimed
   - Annual revenue / capacity claims
   - Contact details visible

2. IDENTIFY RED FLAGS (scam indicators and credibility problems)
   - Stock photos instead of real factory photos
   - Inconsistent company name across documents
   - Unrealistically low prices for the category (likely quality dump or bait-and-switch)
   - Missing or suspicious certifications (e.g., "ISO 9001" without a body name or number)
   - Copy-pasted product descriptions across multiple listings
   - Response time > 24h on Alibaba (signals poor after-sales)
   - Low trade assurance amount vs. claimed volume
   - Mismatch between claimed capacity and employee count

3. IDENTIFY OPPORTUNITIES
   - Specializations that align with premium buyers
   - Verified certifications that reduce compliance burden
   - References to major international brand clients (without violating their NDA)
   - Unique manufacturing capabilities
   - Favorable Incoterms or payment terms signals

4. SCORE on 0–10 scale
   - Risk score: 0 = extremely safe, 10 = high scam/quality risk
   - Credibility score: 0 = no verifiable evidence, 10 = highly credible
   - Quality signal: 0 = poor signals, 10 = strong quality indicators
   For each score, declare your confidence level (low / medium / high).
   When uncertain, lean toward more conservative (higher risk) estimates.

5. WRITE a 2–3 paragraph executive summary in the user's locale (FR or EN).
   The summary must be actionable: what the buyer should do next.

6. STRUCTURED DETAIL SECTIONS
   - pricingAnalysis: price positioning vs. market, MOQ patterns, currency risks
   - communicationSignals: quality of listing copy, responsiveness indicators
   - inconsistencies: list any factual contradictions you found

You are conservative. When in doubt, you flag uncertainty rather than invent.
Do not hallucinate certifications, brand references, or contact details.
Return ONLY structured output via the provided tool — no prose outside the schema.
`.trim();

// Tool definition for structured output (used with Claude tool_use API)
export const SUPPLIER_INTELLIGENCE_TOOL = {
  name: 'report_supplier_intelligence',
  description: 'Report the structured intelligence analysis for a supplier.',
  input_schema: {
    type: 'object' as const,
    required: [
      'companyInfo',
      'riskScore',
      'credibilityScore',
      'qualitySignal',
      'summary',
      'redFlags',
      'opportunities',
      'inconsistencies',
      'model',
      'inputTokens',
      'outputTokens',
      'latencyMs',
    ],
    properties: {
      companyInfo: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          yearsInBusiness: { type: 'number' },
          location: { type: 'string' },
          employeeCount: { type: 'string' },
          certifications: { type: 'array', items: { type: 'string' } },
          capacityClaims: { type: 'string' },
          contactDetails: { type: 'string' },
        },
        required: ['certifications'],
      },
      riskScore: {
        type: 'object',
        required: ['value', 'confidence', 'reasoning'],
        properties: {
          value: { type: 'number', minimum: 0, maximum: 10 },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' },
        },
      },
      credibilityScore: {
        type: 'object',
        required: ['value', 'confidence', 'reasoning'],
        properties: {
          value: { type: 'number', minimum: 0, maximum: 10 },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' },
        },
      },
      qualitySignal: {
        type: 'object',
        required: ['value', 'confidence', 'reasoning'],
        properties: {
          value: { type: 'number', minimum: 0, maximum: 10 },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          reasoning: { type: 'string' },
        },
      },
      summary: { type: 'string' },
      redFlags: {
        type: 'array',
        items: {
          type: 'object',
          required: ['severity', 'title', 'description'],
          properties: {
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      opportunities: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      pricingAnalysis: { type: 'string' },
      communicationSignals: { type: 'string' },
      inconsistencies: { type: 'array', items: { type: 'string' } },
      model: { type: 'string' },
      inputTokens: { type: 'number' },
      outputTokens: { type: 'number' },
      latencyMs: { type: 'number' },
    },
  },
};
