import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FacilityReservationService } from "@/services/facilityReservationService";
import type { Coupon, CouponStats } from "@/types/facility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Calendar,
  DollarSign,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface CouponManagerProps {
  className?: string;
}

export function CouponManager({ className = "" }: CouponManagerProps) {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponStats, setCouponStats] = useState<CouponStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: 0,
    maxUsage: 100,
    maxUsagePerUser: 1,
    minAmount: 0,
    maxDiscount: 0,
    validFrom: '',
    validUntil: '',
    facilityIds: [] as string[],
    facilityCategories: [] as string[],
    userGroups: [] as string[],
    excludeUsers: [] as string[]
  });

  useEffect(() => {
    if (user) {
      loadCoupons();
      loadCouponStats();
    }
  }, [user]);

  async function loadCoupons() {
    setLoading(true);
    try {
      // This would typically call a service method to get coupons
      // For now, we'll use mock data
      const mockCoupons: Coupon[] = [
        {
          id: '1',
          code: 'WELCOME20',
          name: '?�규 가??20% ?�인',
          description: '?�규 ?�용???�용 ?�인 쿠폰',
          discountType: 'percentage',
          discountValue: 20,
          maxUsage: 1000,
          maxUsagePerUser: 1,
          currentUsage: 156,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          facilityIds: [],
          facilityCategories: [],
          minAmount: 10000,
          maxDiscount: 50000,
          excludeSlots: [],
          userGroups: ['new_users'],
          excludeUsers: [],
          createdBy: user?.uid || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalDiscountGiven: 1250000,
          totalBookings: 156
        }
      ];
      setCoupons(mockCoupons);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCouponStats() {
    try {
      const stats = await FacilityReservationService.getCouponStats();
      setCouponStats(stats);
    } catch (error) {
      console.error('Error loading coupon stats:', error);
    }
  }

  function resetForm() {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUsage: 100,
      maxUsagePerUser: 1,
      minAmount: 0,
      maxDiscount: 0,
      validFrom: '',
      validUntil: '',
      facilityIds: [],
      facilityCategories: [],
      userGroups: [],
      excludeUsers: []
    });
  }

  function handleCreateCoupon() {
    // Implementation for creating coupon
    console.log('Creating coupon:', formData);
    setShowCreateModal(false);
    resetForm();
    loadCoupons();
  }

  function handleUpdateCoupon() {
    // Implementation for updating coupon
    console.log('Updating coupon:', formData);
    setShowCreateModal(false);
    setEditingCoupon(null);
    resetForm();
    loadCoupons();
  }

  function handleDeleteCoupon(couponId: string) {
    if (confirm('?�말�???쿠폰????��?�시겠습?�까?')) {
      // Implementation for deleting coupon
      console.log('Deleting coupon:', couponId);
      loadCoupons();
    }
  }

  function handleEditCoupon(coupon: Coupon) {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUsage: coupon.maxUsage,
      maxUsagePerUser: coupon.maxUsagePerUser,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
      facilityIds: coupon.facilityIds,
      facilityCategories: coupon.facilityCategories,
      userGroups: coupon.userGroups,
      excludeUsers: coupon.excludeUsers
    });
    setShowCreateModal(true);
  }

  function copyCouponCode(code: string) {
    navigator.clipboard.writeText(code);
    // Show toast notification
  }

  function getDiscountLabel(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% ?�인`;
    } else {
      return `${coupon.discountValue.toLocaleString()}???�인`;
    }
  }

  function getStatusBadge(coupon: Coupon) {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) {
      return <Badge variant="destructive">비활??/Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="secondary">?�기중</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="destructive">만료??/Badge>;
    }

    if (coupon.currentUsage >= coupon.maxUsage) {
      return <Badge variant="destructive">?�용 ?�료</Badge>;
    }

    return <Badge variant="default">?�성</Badge>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">쿠폰 관�?/h2>
          <p className="text-gray-600">?�인 쿠폰???�성?�고 관리하?�요</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            ?�계 보기
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            ??쿠폰 ?�성
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              쿠폰 ?�용 ?�계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {couponStats.map((stat) => (
                <div key={stat.couponId} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{stat.couponCode}</h4>
                  <p className="text-sm text-gray-600">�??�용: {stat.totalUsage}??/p>
                  <p className="text-sm text-gray-600">
                    �??�인: {stat.totalDiscount.toLocaleString()}??
                  </p>
                  <p className="text-sm text-gray-600">
                    ?�균 ?�인: {stat.averageDiscount.toLocaleString()}??
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>쿠폰 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">로딩 �?..</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ?�록??쿠폰???�습?�다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코드</TableHead>
                  <TableHead>?�름</TableHead>
                  <TableHead>?�인</TableHead>
                  <TableHead>?�용??/TableHead>
                  <TableHead>?�효기간</TableHead>
                  <TableHead>?�태</TableHead>
                  <TableHead>?�업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCouponCode(coupon.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{coupon.name}</div>
                        <div className="text-sm text-gray-500">
                          {coupon.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getDiscountLabel(coupon)}
                      </div>
                      {coupon.maxDiscount > 0 && (
                        <div className="text-sm text-gray-500">
                          최�? {coupon.maxDiscount.toLocaleString()}??
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {coupon.currentUsage} / {coupon.maxUsage}
                      </div>
                      <div className="text-xs text-gray-500">
                        ?�용?�당 {coupon.maxUsagePerUser}??
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          ~ {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(coupon)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? '쿠폰 ?�정' : '??쿠폰 ?�성'}
            </DialogTitle>
            <DialogDescription>
              ?�인 쿠폰???�세 ?�보�??�력?�세??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">쿠폰 코드</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="WELCOME20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">쿠폰�?/label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="?�규 가???�인"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">?�명</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="쿠폰 ?�용 조건�??�택???�명?�세??
              />
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">?�인 ?�형</label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'percentage' | 'fixed_amount') =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">?�센???�인</SelectItem>
                    <SelectItem value="fixed_amount">?�액 ?�인</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">?�인 �?/label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  placeholder={formData.discountType === 'percentage' ? '20' : '5000'}
                />
              </div>
              <div>
                <label className="text-sm font-medium">최�? ?�인</label>
                <Input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">?�체 ?�용 ?�도</label>
                <Input
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">?�용?�당 ?�도</label>
                <Input
                  type="number"
                  value={formData.maxUsagePerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsagePerUser: Number(e.target.value) })}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">?�효 ?�작??/label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">?�효 종료??/label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            {/* Restrictions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">최소 결제 금액</label>
                <Input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                  placeholder="10000"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              취소
            </Button>
            <Button
              onClick={editingCoupon ? handleUpdateCoupon : handleCreateCoupon}
            >
              {editingCoupon ? '?�정' : '?�성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
