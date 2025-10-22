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
      console.error("?ˆì•½ ê²€ì¦??¤íŒ¨:", error);
      setValidation({
        isValid: false,
        errors: ["?ˆì•½ ê²€ì¦ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤."],
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
      console.error("?¬ë¡¯ ?íƒœ ?•ì¸ ?¤íŒ¨:", error);
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
        mockRestrictions.push("?¬ì „ ê²°ì œ ?„ìš”");
      }
      if (mockTrustScore < 50 && mockDailyBookings >= 1) {
        mockRestrictions.push("?˜ë£¨ 1ê±??œí•œ");
      }
      setRestrictions(mockRestrictions);
    } catch (error) {
      console.error("?¬ìš©??? ë¢°???•ë³´ ë¡œë“œ ?¤íŒ¨:", error);
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
        throw new Error(result.error || "?ˆì•½???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      }
    } catch (error: any) {
      console.error("?ˆì•½ ?ì„± ?¤íŒ¨:", error);
      onError?.(error.message || "?ˆì•½???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      setStep('confirmation');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(timestamp: any): string {
    if (!timestamp) return "?œê°„ ?•ë³´ ?†ìŒ";
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return date.toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "?œê°„ ?•ë³´ ?¤ë¥˜";
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
        return `${diffHours}?œê°„ ${diffMinutes > 0 ? diffMinutes + 'ë¶? : ''}`;
      }
      return `${diffMinutes}ë¶?;
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
            ?¬ë¡¯ ?ˆì•½
          </DialogTitle>
          <DialogDescription>
            ? íƒ???¬ë¡¯???ì„¸ ?•ë³´ë¥??•ì¸?˜ê³  ?ˆì•½??ì§„í–‰?˜ì„¸??
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Slot Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">?¬ë¡¯ ?•ë³´</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">?œì‘ ?œê°„</span>
                  <span className="font-medium">{formatTime(slot.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">ì¢…ë£Œ ?œê°„</span>
                  <span className="font-medium">{formatTime(slot.endAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">?˜ìš© ?¸ì›</span>
                  <span className="font-medium">
                    {slot.reserved}/{slot.maxCapacity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">ê°€ê²?/span>
                  <span className="font-medium">??slot.price.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">?´ìš© ?œê°„</span>
                <span className="font-medium">{formatDuration(slot.startAt, slot.endAt)}</span>
              </div>

              {slotStatus && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    slotStatus.canBook ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm">
                    {slotStatus.canBook ? '?ˆì•½ ê°€?? : '?ˆì•½ ë¶ˆê?'}
                  </span>
                  {slotStatus.timeUntilStart && (
                    <span className="text-xs text-gray-500">
                      (?œì‘ê¹Œì? {slotStatus.timeUntilStart}ë¶?
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
                ? ë¢°???•ë³´
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getTrustGradeColor(trustGrade)}>
                    {trustGrade}?±ê¸‰
                  </Badge>
                  <span className="text-sm text-gray-600">
                    ? ë¢°???ìˆ˜: {trustScore}??
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">?¤ëŠ˜ ?ˆì•½</div>
                  <div className="font-medium">{dailyBookings}ê±?/div>
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
                    ?°ìˆ˜??? ë¢°?„ë¡œ ëª¨ë“  ?œíƒ??ë°›ì„ ???ˆìŠµ?ˆë‹¤!
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
                  ?ˆì•½ ê²€ì¦?ê²°ê³¼
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
                      ?ˆì•½??ê°€?¥í•©?ˆë‹¤! ?„ë˜ ?•ë³´ë¥??•ì¸?˜ê³  ì§„í–‰?˜ì„¸??
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
                <CardTitle className="text-lg">ì¶”ê? ?•ë³´</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ë©”ëª¨ (? íƒ?¬í•­)
                  </label>
                  <Textarea
                    placeholder="?ˆì•½ ê´€???¹ë³„ ?”ì²­?¬í•­?´ë‚˜ ë©”ëª¨ë¥??…ë ¥?˜ì„¸??.."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ?¹ë³„ ?”ì²­ (? íƒ?¬í•­)
                  </label>
                  <div className="space-y-2">
                    {['?¥ë¹„ ?€??, 'ê°•ì‚¬ ?”ì²­', '?¹ë³„ ì¤€ë¹„ë¬¼', '?‘ê·¼??ì§€??].map((request) => (
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
                <p className="text-gray-600">?ˆì•½??ì²˜ë¦¬?˜ê³  ?ˆìŠµ?ˆë‹¤...</p>
                <p className="text-sm text-gray-500 mt-2">? ì‹œë§?ê¸°ë‹¤?¤ì£¼?¸ìš”</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            ì·¨ì†Œ
          </Button>
          
          {step === 'validation' && validation?.isValid && (
            <Button onClick={() => setStep('confirmation')} disabled={loading}>
              ?¤ìŒ ?¨ê³„
            </Button>
          )}
          
          {step === 'confirmation' && (
            <Button onClick={handleBooking} disabled={loading}>
              ?ˆì•½?˜ê¸°
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
