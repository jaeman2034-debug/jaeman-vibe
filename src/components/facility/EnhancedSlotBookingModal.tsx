import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FacilityReservationService } from "@/services/facilityReservationService";
import type { 
  FacilitySlot, 
  SlotStatus, 
  BookingValidationResult,
  CreateReservationRequest 
} from "@/types/facility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Clock, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  MapPin,
  Star,
  Shield,
  Info
} from "lucide-react";

interface EnhancedSlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: FacilitySlot | null;
  facilityId: string;
  onSuccess?: (reservationId: string) => void;
  onError?: (error: string) => void;
}

export function EnhancedSlotBookingModal({
  isOpen,
  onClose,
  slot,
  facilityId,
  onSuccess,
  onError
}: EnhancedSlotBookingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<BookingValidationResult | null>(null);
  const [slotStatus, setSlotStatus] = useState<SlotStatus | null>(null);
  const [notes, setNotes] = useState("");
  const [specialRequests, setSpecialRequests] = useState<string[]>([]);
  const [step, setStep] = useState<'validation' | 'confirmation' | 'processing'>('validation');

  // Trust policy states
  const [trustScore, setTrustScore] = useState<number>(0);
  const [trustGrade, setTrustGrade] = useState<string>("");
  const [dailyBookings, setDailyBookings] = useState<number>(0);
  const [restrictions, setRestrictions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && slot && user) {
      validateBooking();
      checkSlotStatus();
      loadUserTrustInfo();
    }
  }, [isOpen, slot, user]);

  async function validateBooking() {
    if (!slot || !user) return;

    setLoading(true);
    try {
      const result = await FacilityReservationService.validateBooking(
        user.uid,
        slot.id,
        facilityId
      );
      setValidation(result);
      
      if (result.isValid) {
        setStep('confirmation');
      }
    } catch (error) {
      console.error("?�약 검�??�패:", error);
      setValidation({
        isValid: false,
        errors: ["?�약 검증에 ?�패?�습?�다."],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  }

  async function checkSlotStatus() {
    if (!slot) return;

    try {
      const status = await FacilityReservationService.checkSlotStatus(slot.id);
      setSlotStatus(status);
    } catch (error) {
      console.error("?�롯 ?�태 ?�인 ?�패:", error);
    }
  }

  async function loadUserTrustInfo() {
    if (!user) return;

    try {
      // This would typically come from user trust service
      // For now, we'll simulate the data
      const mockTrustScore = Math.floor(Math.random() * 40) + 60; // 60-100 range
      const mockDailyBookings = Math.floor(Math.random() * 3);
      
      setTrustScore(mockTrustScore);
      setTrustGrade(getTrustGrade(mockTrustScore));
      setDailyBookings(mockDailyBookings);

      // Simulate restrictions based on trust score
      const mockRestrictions: string[] = [];
      if (mockTrustScore < 30) {
        mockRestrictions.push("?�전 결제 ?�요");
      }
      if (mockTrustScore < 50 && mockDailyBookings >= 1) {
        mockRestrictions.push("?�루 1�??�한");
      }
      setRestrictions(mockRestrictions);
    } catch (error) {
      console.error("?�용???�뢰???�보 로드 ?�패:", error);
    }
  }

  function getTrustGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C+";
    if (score >= 40) return "C";
    if (score >= 30) return "D+";
    if (score >= 20) return "D";
    return "F";
  }

  function getTrustGradeColor(grade: string): string {
    if (grade.startsWith('A')) return "text-green-600 bg-green-100";
    if (grade.startsWith('B')) return "text-blue-600 bg-blue-100";
    if (grade.startsWith('C')) return "text-yellow-600 bg-yellow-100";
    if (grade.startsWith('D')) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  }

  async function handleBooking() {
    if (!slot || !user || !validation?.isValid) return;

    setStep('processing');
    setLoading(true);

    try {
      const request: CreateReservationRequest = {
        facilityId,
        slotId: slot.id,
        userId: user.uid,
        price: slot.price,
        notes: notes.trim() || undefined
      };

      const result = await FacilityReservationService.createReservation(request);
      
      if (result.ok && result.reservationId) {
        onSuccess?.(result.reservationId);
        onClose();
      } else {
        throw new Error(result.error || "?�약???�패?�습?�다.");
      }
    } catch (error: any) {
      console.error("?�약 ?�성 ?�패:", error);
      onError?.(error.message || "?�약???�패?�습?�다.");
      setStep('confirmation');
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

  function formatDuration(start: any, end: any): string {
    if (!start || !end) return "";
    
    try {
      const startDate = start instanceof Date ? start : start.toDate();
      const endDate = end instanceof Date ? end : end.toDate();
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}?�간 ${diffMinutes > 0 ? diffMinutes + '�? : ''}`;
      }
      return `${diffMinutes}�?;
    } catch {
      return "";
    }
  }

  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            ?�롯 ?�약
          </DialogTitle>
          <DialogDescription>
            ?�택???�롯???�세 ?�보�??�인?�고 ?�약??진행?�세??
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Slot Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">?�롯 ?�보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">?�작 ?�간</span>
                  <span className="font-medium">{formatTime(slot.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">종료 ?�간</span>
                  <span className="font-medium">{formatTime(slot.endAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">?�용 ?�원</span>
                  <span className="font-medium">
                    {slot.reserved}/{slot.maxCapacity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">가�?/span>
                  <span className="font-medium">??slot.price.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">?�용 ?�간</span>
                <span className="font-medium">{formatDuration(slot.startAt, slot.endAt)}</span>
              </div>

              {slotStatus && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    slotStatus.canBook ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm">
                    {slotStatus.canBook ? '?�약 가?? : '?�약 불�?'}
                  </span>
                  {slotStatus.timeUntilStart && (
                    <span className="text-xs text-gray-500">
                      (?�작까�? {slotStatus.timeUntilStart}�?
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Trust Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                ?�뢰???�보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getTrustGradeColor(trustGrade)}>
                    {trustGrade}?�급
                  </Badge>
                  <span className="text-sm text-gray-600">
                    ?�뢰???�수: {trustScore}??
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">?�늘 ?�약</div>
                  <div className="font-medium">{dailyBookings}�?/div>
                </div>
              </div>

              {restrictions.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {restrictions.map((restriction, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span>{restriction}</span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {restrictions.length === 0 && trustScore >= 80 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ?�수???�뢰?�로 모든 ?�택??받을 ???�습?�다!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Validation Results */}
          {validation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  ?�약 검�?결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validation.errors.length > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validation.errors.map((error, index) => (
                          <div key={index} className="text-red-600">{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <div key={index} className="text-yellow-600">{warning}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {validation.isValid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ?�약??가?�합?�다! ?�래 ?�보�??�인?�고 진행?�세??
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {step === 'confirmation' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">추�? ?�보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메모 (?�택?�항)
                  </label>
                  <Textarea
                    placeholder="?�약 관???�별 ?�청?�항?�나 메모�??�력?�세??.."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ?�별 ?�청 (?�택?�항)
                  </label>
                  <div className="space-y-2">
                    {['?�비 ?�??, '강사 ?�청', '?�별 준비물', '?�근??지??].map((request) => (
                      <label key={request} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={specialRequests.includes(request)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSpecialRequests([...specialRequests, request]);
                            } else {
                              setSpecialRequests(specialRequests.filter(r => r !== request));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">{request}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">?�약??처리?�고 ?�습?�다...</p>
                <p className="text-sm text-gray-500 mt-2">?�시�?기다?�주?�요</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          
          {step === 'validation' && validation?.isValid && (
            <Button onClick={() => setStep('confirmation')} disabled={loading}>
              ?�음 ?�계
            </Button>
          )}
          
          {step === 'confirmation' && (
            <Button onClick={handleBooking} disabled={loading}>
              ?�약?�기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
