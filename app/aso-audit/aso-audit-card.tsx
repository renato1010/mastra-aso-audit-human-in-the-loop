'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Search,
  Image,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Type
} from 'lucide-react';
import type { AsoAudit } from '@/src/mastra/types/aso-audit';

type AsoAuditData = AsoAudit['data'];

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A':
      return 'bg-green-500';
    case 'B':
      return 'bg-lime-500';
    case 'C':
      return 'bg-yellow-500';
    case 'D':
      return 'bg-orange-500';
    case 'F':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getPriorityVariant(priority: string): 'destructive' | 'secondary' | 'outline' {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
}

function ScoreItem({
  label,
  score,
  icon: Icon
}: {
  label: string;
  score: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={score} className="w-24 h-2" />
        <span className={`text-sm font-medium w-8 text-right ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

export function AsoAuditCard({ data }: { data: AsoAuditData }) {
  const formattedDate = new Date(data.app.lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* App Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.app.icon}
              alt={`${data.app.title} icon`}
              className="w-20 h-20 rounded-2xl shadow-md"
              crossOrigin="anonymous"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{data.app.title}</CardTitle>
                  <CardDescription>{data.app.developer}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="uppercase">
                    {data.country}
                  </Badge>
                  <Badge className="border border-zinc-400" variant="secondary">
                    {data.app.category}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{(data.app.rating / 10).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{data.app.reviews.toLocaleString()} reviews</span>
                </div>
                <div>
                  {data.app.price === 0 ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Free
                    </Badge>
                  ) : (
                    <span>${data.app.price}</span>
                  )}
                </div>
                <span>Updated: {formattedDate}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ASO Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ASO Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">{data.asoScore}</div>
              <div
                className={`w-12 h-12 rounded-full ${getGradeColor(data.gradeLabel)} flex items-center justify-center text-white text-[0.6rem] font-bold`}
              >
                {data.gradeLabel}
              </div>
            </div>
            <Progress value={data.asoScore} className="mt-4" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Keywords Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{data.keywords.tracked}</div>
                <div className="text-xs text-muted-foreground">Tracked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{data.keywords.top10Count}</div>
                <div className="text-xs text-muted-foreground">Top 10</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{data.keywords.top30Count}</div>
                <div className="text-xs text-muted-foreground">Top 30</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.keywords.avgRank}</div>
                <div className="text-xs text-muted-foreground">Avg Rank</div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>
                Best keyword: <strong>{data.keywords.bestKeyword.keyword}</strong> (Rank #
                {data.keywords.bestKeyword.rank})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
          <CardDescription>Detailed analysis of your ASO performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <ScoreItem label="Title" score={data.scoreBreakdown.titleScore} icon={Type} />
              <ScoreItem label="Subtitle" score={data.scoreBreakdown.subtitleScore} icon={Type} />
              <ScoreItem
                label="Description"
                score={data.scoreBreakdown.descriptionScore}
                icon={FileText}
              />
              <ScoreItem label="Rating" score={data.scoreBreakdown.ratingScore} icon={Star} />
              <ScoreItem
                label="Reviews"
                score={data.scoreBreakdown.reviewsScore}
                icon={MessageSquare}
              />
            </div>
            <div>
              <ScoreItem
                label="Keyword Coverage"
                score={data.scoreBreakdown.keywordCoverageScore}
                icon={Search}
              />
              <ScoreItem
                label="Visual Assets"
                score={data.scoreBreakdown.visualAssetsScore}
                icon={Image}
              />
              <ScoreItem
                label="Localization"
                score={data.scoreBreakdown.localizationScore}
                icon={Globe}
              />
              <ScoreItem
                label="Update Frequency"
                score={data.scoreBreakdown.updateFrequencyScore}
                icon={RefreshCw}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata Details</CardTitle>
          <CardDescription>Title and description statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Title Length</div>
              <div className="text-lg font-semibold">
                {data.metadata.titleLength} / {data.metadata.titleMaxChars}
              </div>
              <Progress
                value={(data.metadata.titleLength / data.metadata.titleMaxChars) * 100}
                className="h-1.5"
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Title Has Keyword</div>
              <div className="flex items-center gap-2">
                {data.metadata.titleHasKeyword ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Yes</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">No</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Description Length</div>
              <div className="text-lg font-semibold">{data.metadata.descriptionLength} chars</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Description Words</div>
              <div className="text-lg font-semibold">
                {data.metadata.descriptionWordCount} words
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-4 w-4 text-muted-foreground" />
              <span>{data.app.screenshotCount} Screenshots</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>{data.app.languageCount} Languages</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actions to improve your ASO score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 ${
                      rec.priority === 'high'
                        ? 'text-red-500'
                        : rec.priority === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={getPriorityVariant(rec.priority)}
                        className="capitalize text-zinc-400"
                      >
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="capitalize border-zinc-400 text-zinc-600">
                        {rec.category}
                      </Badge>
                    </div>
                    <p className="font-medium">{rec.issue}</p>
                    <p className="text-sm text-muted-foreground mt-1">{rec.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
