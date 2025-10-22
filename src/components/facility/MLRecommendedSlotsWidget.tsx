import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FacilityReservationService } from "@/services/facilityReservationService";
import type { MLSlotRecommendation, MLRecommendationRequest } from "@/types/facility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Sparkles,
  Calendar,
  MapPin
} from "lucide-react";

interface MLRecommendedSlotsWidgetProps {
  facilityId: string;
  maxRecommendations?: number;
  showFactors?: boolean;
  className?: string;
}

export function MLRecommendedSlotsWidget({
  facilityId,
  maxRecommendations = 5,
  showFactors = true,
  className = ""
}: MLRecommendedSlotsWidgetProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MLSlotRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);

  useEffect(() => {
    if (user && facilityId) {
      loadRecommendations();
    }
  }, [user, facilityId]);

  async function loadRecommendations() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const request: MLRecommendationRequest = {
        userId: user.uid,
        facilityId,
        dateRange: {
          start: new Date().toISOString().slice(0, 10), // Today
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // Next 7 days
        },
        preferences: {
          timeSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
          maxPrice: 50000,
          minCapacity: 1
        }
      };

      const results = await FacilityReservationService.getMLRecommendedSlots(request);
      setRecommendations(results.slice(0, maxRecommendations));
    } catch (err) {
      console.error("ML 추천 로드 ?�패:", err);
      setError("AI 추천??불러?�는???�패?�습?�다.");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp: any): string {
    if (!timestamp) return "?�간 ?�보 ?�음";
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return date.toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "?�간 ?�보 ?�류";
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return "최고";
    if (score >= 60) return "좋음";
    if (score >= 40) return "보통";
    return "??��";
  }

  function getFactorIcon(factor: string) {
    switch (factor) {
      case 'timeConvenience':
        return <Clock className="w-4 h-4" />;
      case 'popularity':
        return <TrendingUp className="w-4 h-4" />;
      case 'priceValue':
        return <DollarSign className="w-4 h-4" />;
      case 'userPreference':
        return <Star className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  }

  function getFactorLabel(factor: string): string {
    switch (factor) {
      case 'timeConvenience':
        return '?�간 ?�의??;
      case 'popularity':
        return '?�기??;
      case 'priceValue':
        return '가�??��?;
      case 'userPreference':
        return '?�용???�호';
      default:
        return factor;
    }
  }

  function getFactorColor(factor: string): string {
    switch (factor) {
      case 'timeConvenience':
        return 'text-blue-600 bg-blue-50';
      case 'popularity':
        return 'text-purple-600 bg-purple-50';
      case 'priceValue':
        return 'text-green-600 bg-green-50';
      case 'userPreference':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI 추천 ?�롯
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">로그?�이 ?�요?�니??</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI 추천 ?�롯
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI 추천 ?�롯
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-600 mb-3">{error}</p>
            <Button onClick={loadRecommendations} variant="outline" size="sm">
              ?�시 ?�도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI 추천 ?�롯
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">?�재 추천???�롯???�습?�다</p>
            <p className="text-sm text-gray-400">??많�? ?�롯??추�??�면 AI가 추천?�드립니??/p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI 추천 ?�롯
          <Badge variant="secondary" className="ml-2">
            {recommendations.length}�?
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          ?�신???�호?��? ?�용 ?�턴??분석??맞춤??추천
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.slotId}
            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
              expandedSlot === recommendation.slotId ? 'ring-2 ring-purple-200' : ''
            }`}
          >
            {/* Main Recommendation Info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`${getScoreColor(recommendation.score)} border-0`}
                  >
                    {getScoreLabel(recommendation.score)} ({recommendation.score.toFixed(0)}??
                  </Badge>
                  <span className="text-xs text-gray-500">
                    #{index + 1} 추천
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatTime(recommendation.startAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(recommendation.endAt)}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedSlot(
                  expandedSlot === recommendation.slotId ? null : recommendation.slotId
                )}
                className="text-gray-500 hover:text-gray-700"
              >
                {expandedSlot === recommendation.slotId ? '?�기' : '?�세??}
              </Button>
            </div>

            {/* Reason */}
            <p className="text-sm text-gray-700 mb-3">
              ?�� {recommendation.reason}
            </p>

            {/* Expanded Details */}
            {expandedSlot === recommendation.slotId && (
              <div className="border-t pt-3 space-y-3">
                {/* Factor Scores */}
                {showFactors && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">?�세 ?�수 분석</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(recommendation.factors).map(([factor, score]) => (
                        <div key={factor} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className={getFactorColor(factor)}>
                              {getFactorIcon(factor)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {getFactorLabel(factor)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {score.toFixed(0)}??
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    ?�약?�기
                  </Button>
                  <Button size="sm" variant="outline">
                    ?�세보기
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Actions (when not expanded) */}
            {expandedSlot !== recommendation.slotId && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  빠른 ?�약
                </Button>
                <Button size="sm" variant="ghost">
                  <Star className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="border-t pt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">
            AI 추천?� ?�시간으�??�데?�트?�니??
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadRecommendations}
            className="text-purple-600 hover:text-purple-700"
          >
            ?�로고침
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
