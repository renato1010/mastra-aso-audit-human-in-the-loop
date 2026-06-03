import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { AsoAuditMetadata, asoAuditMetadataSchema } from '@/mastra/schemas';
import { APPEEKY_API_BASE_URL } from '@/lib/constants';
import type { AsoAudit } from '@/mastra/types/aso-audit';
import { APPEEKY_API_KEY } from '@/mastra/env-vars';

type JsonBody = Record<string, unknown> | unknown[];

export async function fetchGenericRes<TResponse>(
  url: string,
  options?: Omit<RequestInit, 'body'> & {
    body?: BodyInit | JsonBody | null;
  }
): Promise<TResponse & { status: number }> {
  const { body: rawBody, headers: callerHeaders = {}, ...rest } = options ?? {};

  const headers = new Headers(callerHeaders);

  let body: BodyInit | null = null;

  if (rawBody != null) {
    // If caller already supplied a BodyInit, pass it through untouched.
    const isAlreadyBodyInit =
      (typeof FormData !== 'undefined' && rawBody instanceof FormData) ||
      rawBody instanceof URLSearchParams ||
      rawBody instanceof Blob ||
      rawBody instanceof ArrayBuffer ||
      ArrayBuffer.isView(rawBody) ||
      typeof rawBody === 'string';

    if (isAlreadyBodyInit) {
      body = rawBody as BodyInit;
      // Never set Content-Type for FormData; browser must do it.
    } else {
      // plain JS object/array -> JSON
      body = JSON.stringify(rawBody);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
  }
  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      body
    });
    const resBody = await response.json();
    const responseBody = resBody as TResponse;
    const responseData = { ...responseBody, status: response.status };
    return responseData;
  } catch (error) {
    throw new Error(`Failed to fetch from ${url}: ${error}`);
  }
}
const idRegex = /\/id(\d+)$/;
// export the core logic separately:
export async function fetchAsoMetadata(input: {
  url: string;
}): Promise<AsoAuditMetadata | undefined> {
  const matchedId = input.url.match(idRegex)?.[1];
  console.log('Extracted app ID from URL:', matchedId);
  if (!matchedId) return undefined;
  const appeekyAsoAuditUrl = `${APPEEKY_API_BASE_URL}/v1/aso/audit/${matchedId}?country=us`;

  try {
    const asoAuditResponse = await fetchGenericRes<AsoAudit['data']>(appeekyAsoAuditUrl, {
      headers: {
        'X-API-Key': APPEEKY_API_KEY,
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });
    // return full ASO audit data for now
    return asoAuditResponse;
  } catch (_error) {
    return undefined;
  }
}

// export mock fetchAsoMetadata returns a hardcoded response for testing without hitting the real API
export async function mockFetchAsoMetadata(_input: { url: string }): Promise<AsoAuditMetadata> {
  // mock promise delay and return an object that matches the AsoAuditMetadata type
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        appId: '913335252',
        country: 'us',
        app: {
          title: 'Brilliant: Learn by doing',
          developer: 'Brilliant.org',
          icon: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/53/9c/02/539c0256-3fb4-64a2-0aac-d0afaf429069/Placeholder.mill/200x200bb-75.jpg',
          rating: 4.74,
          reviews: 27315,
          category: 'Education',
          price: 0,
          lastUpdated: '2026-01-26T12:19:36Z',
          description: 'Master concepts in math, data science, and computer science through fun...',
          screenshotCount: 6,
          languageCount: 1
        },
        asoScore: 72,
        gradeLabel: 'Average',
        scoreBreakdown: {
          titleScore: 85,
          subtitleScore: 70,
          descriptionScore: 75,
          ratingScore: 90,
          reviewsScore: 60,
          keywordCoverageScore: 55,
          visualAssetsScore: 75,
          localizationScore: 20,
          updateFrequencyScore: 80
        },
        recommendations: [
          {
            priority: 'high',
            category: 'Keywords',
            issue: 'Only ranking for 8 keywords with limited top-10 positions',
            suggestion:
              'Research and target 15-25 keywords mixing high-volume (competitive) and long-tail (easier to rank) terms. Update keyword field regularly.'
          },
          {
            priority: 'medium',
            category: 'Reviews',
            issue: 'Only 27,315 reviews - need more social proof',
            suggestion:
              "Use Apple's SKStoreReviewController to prompt reviews at strategic moments. Respond to existing reviews to boost engagement."
          },
          {
            priority: 'low',
            category: 'Localization',
            issue: 'Only 1 languages supported',
            suggestion:
              'Localize metadata (title, subtitle, keywords, description) for top markets: Spanish, German, French, Japanese, Chinese, Portuguese, Korean.'
          }
        ],
        keywords: {
          tracked: 8,
          top10Count: 2,
          top30Count: 5,
          avgRank: 18,
          bestKeyword: { keyword: 'learn math', rank: 3 }
        },
        metadata: {
          titleLength: 25,
          titleMaxChars: 30,
          titleHasKeyword: true,
          descriptionLength: 1250,
          descriptionWordCount: 210
        }
      });
    }, 500);
  });
}

// Tool
export const fetchAsoAuditMetadata = createTool({
  id: 'fetch-aso-audit',
  description: 'Fetch ASO audit data for a given app URL',
  inputSchema: z.object({
    url: z.url().describe('The URL of the app listing to audit')
  }),
  outputSchema: asoAuditMetadataSchema,
  execute: async (inputData) => {
    const asoAuditResponse = await fetchAsoMetadata(inputData);
    if (!asoAuditResponse) {
      throw new Error('Failed to fetch ASO audit metadata.');
    }
    // return only surface-level metadata for confirmation step
    return asoAuditResponse;
  }
});
