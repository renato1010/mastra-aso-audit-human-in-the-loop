export interface AsoAudit {
  data: {
    appId: string;
    country: string;
    app: {
      title: string;
      developer: string;
      icon: string;
      rating: number;
      reviews: number;
      category: string;
      price: number;
      lastUpdated: string; // ISO Date string
      description: string;
      screenshotCount: number;
      languageCount: number;
    };
    asoScore: number;
    gradeLabel: string;
    scoreBreakdown: {
      titleScore: number;
      subtitleScore: number;
      descriptionScore: number;
      ratingScore: number;
      reviewsScore: number;
      keywordCoverageScore: number;
      visualAssetsScore: number;
      localizationScore: number;
      updateFrequencyScore: number;
    };
    recommendations: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      issue: string;
      suggestion: string;
    }[];
    keywords: {
      tracked: number;
      top10Count: number;
      top30Count: number;
      avgRank: number;
      bestKeyword: {
        keyword: string;
        rank: number;
      };
    };
    metadata: {
      titleLength: number;
      titleMaxChars: number;
      titleHasKeyword: boolean;
      descriptionLength: number;
      descriptionWordCount: number;
    };
  };
}
