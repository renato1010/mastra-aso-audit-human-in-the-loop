import { z } from 'zod';

export const surfaceLevelMetadataSchema = z.object({
  name: z.string(),
  developer: z.string(),
  icon: z.string(),
  category: z.string(),
  country: z.string()
});

// typescript type for surfaceLevelMetadataSchema
export type SurfaceLevelMetadata = z.infer<typeof surfaceLevelMetadataSchema>;

export const asoAuditMetadataSchema = z
  .object({
    appId: z.string(),
    country: z.string(),
    app: z.object({
      title: z.string(),
      developer: z.string(),
      icon: z.string(),
      rating: z.number().min(0).max(100),
      reviews: z.number().min(0),
      category: z.string(),
      price: z.number().min(0),
      lastUpdated: z.iso.datetime(),
      description: z.string(),
      screenshotCount: z.number().min(0).max(100),
      languageCount: z.number().min(0).max(100)
    }),
    asoScore: z.number().min(0).max(100),
    gradeLabel: z.string(),
    scoreBreakdown: z.object({
      titleScore: z.number().min(0).max(100),
      subtitleScore: z.number().min(0).max(100),
      descriptionScore: z.number().min(0).max(100),
      ratingScore: z.number().min(0).max(100),
      reviewsScore: z.number().min(0).max(100),
      keywordCoverageScore: z.number().min(0).max(100),
      visualAssetsScore: z.number().min(0).max(100),
      localizationScore: z.number().min(0).max(100),
      updateFrequencyScore: z.number().min(0).max(100)
    }),
    recommendations: z.array(
      z.object({
        priority: z.enum(['high', 'medium', 'low']),
        category: z.string(),
        issue: z.string(),
        suggestion: z.string()
      })
    ),
    keywords: z.object({
      tracked: z.number().min(0).max(100),
      top10Count: z.number().min(0).max(100),
      top30Count: z.number().min(0).max(100),
      avgRank: z.number().min(0).max(100),
      bestKeyword: z.looseObject({
        keyword: z.string(),
        rank: z.number().min(0).max(100)
      })
    }),
    metadata: z.object({
      titleLength: z.number().min(0).max(100),
      titleMaxChars: z.number().min(0).max(400),
      titleHasKeyword: z.boolean(),
      descriptionLength: z.number().min(0),
      descriptionWordCount: z.number().min(0)
    })
  })
  .optional();

export type AsoAuditMetadata = z.infer<typeof asoAuditMetadataSchema>;

export const stateMetadataSchema = z.object({
  metadata: asoAuditMetadataSchema
});

export type AsoAuditStateMetadata = z.infer<typeof stateMetadataSchema>;
