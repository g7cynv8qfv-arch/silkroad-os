// Content extraction step of the intelligence pipeline.
// For URLs: classifies the domain type.
// For PDFs/images: returns the source reference as-is (file upload handled client-side).
// For manual: trims and normalizes.
//
// In the real implementation, URL fetching would use Cheerio to scrape page
// content, and PDF parsing would use pdf-parse or a similar library.

export type SourceProfile =
  | { kind: 'alibaba_url'; url: string; domain: string }
  | { kind: 'url_1688'; url: string; domain: string }
  | { kind: 'generic_url'; url: string; domain: string }
  | { kind: 'pdf'; filename: string }
  | { kind: 'image'; filename: string }
  | { kind: 'manual'; text: string };

export type ExtractResult = {
  profile: SourceProfile;
  extractedText: string;
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function extractContent(
  sourceType: 'URL' | 'PDF' | 'IMAGE' | 'MANUAL',
  sourceRef: string,
): Promise<ExtractResult> {
  switch (sourceType) {
    case 'URL': {
      const domain = extractDomain(sourceRef);
      const lowerRef = sourceRef.toLowerCase();

      let kind: SourceProfile['kind'];
      if (lowerRef.includes('alibaba.com')) {
        kind = 'alibaba_url';
      } else if (lowerRef.includes('1688.com')) {
        kind = 'url_1688';
      } else {
        kind = 'generic_url';
      }

      return {
        profile: { kind, url: sourceRef, domain } as SourceProfile,
        // In real impl: fetch + parse with Cheerio
        extractedText: `[URL content from ${domain}] ${sourceRef}`,
      };
    }

    case 'PDF':
      return {
        profile: { kind: 'pdf', filename: sourceRef },
        // In real impl: pdf-parse(buffer)
        extractedText: `[PDF content extracted from: ${sourceRef}]`,
      };

    case 'IMAGE':
      return {
        profile: { kind: 'image', filename: sourceRef },
        // In real impl: pass image buffer directly to Claude vision
        extractedText: `[Image: ${sourceRef}]`,
      };

    case 'MANUAL':
      return {
        profile: { kind: 'manual', text: sourceRef },
        extractedText: sourceRef.trim(),
      };
  }
}
