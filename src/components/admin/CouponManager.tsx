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
          name: '?†Í∑ú Í∞Ä??20% ?†Ïù∏',
          description: '?†Í∑ú ?¨Ïö©???ÑÏö© ?†Ïù∏ Ïø†Ìè∞',
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
    if (confirm('?ïÎßêÎ°???Ïø†Ìè∞????†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) {
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
      return `${coupon.discountValue}% ?†Ïù∏`;
    } else {
      return `${coupon.discountValue.toLocaleString()}???†Ïù∏`;
    }
  }

  function getStatusBadge(coupon: Coupon) {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (!coupon.isActive) {
      return <Badge variant="destructive">ÎπÑÌôú??/Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="secondary">?ÄÍ∏∞Ï§ë</Badge>;
    }

    if (now > validUntil) {
      return <Badge variant="destructive">ÎßåÎ£å??/Badge>;
    }

    if (coupon.currentUsage >= coupon.maxUsage) {
      return <Badge variant="destructive">?¨Ïö© ?ÑÎ£å</Badge>;
    }

    return <Badge variant="default">?úÏÑ±</Badge>;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ïø†Ìè∞ Í¥ÄÎ¶?/h2>
          <p className="text-gray-600">?†Ïù∏ Ïø†Ìè∞???ùÏÑ±?òÍ≥† Í¥ÄÎ¶¨Ìïò?∏Ïöî</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            ?µÍ≥Ñ Î≥¥Í∏∞
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            ??Ïø†Ìè∞ ?ùÏÑ±
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ïø†Ìè∞ ?¨Ïö© ?µÍ≥Ñ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {couponStats.map((stat) => (
                <div key={stat.couponId} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{stat.couponCode}</h4>
                  <p className="text-sm text-gray-600">Ï¥??¨Ïö©: {stat.totalUsage}??/p>
                  <p className="text-sm text-gray-600">
                    Ï¥??†Ïù∏: {stat.totalDiscount.toLocaleString()}??
                  </p>
                  <p className="text-sm text-gray-600">
                    ?âÍ∑† ?†Ïù∏: {stat.averageDiscount.toLocaleString()}??
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
          <CardTitle>Ïø†Ìè∞ Î™©Î°ù</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Î°úÎî© Ï§?..</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ?±Î°ù??Ïø†Ìè∞???ÜÏäµ?àÎã§.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ÏΩîÎìú</TableHead>
                  <TableHead>?¥Î¶Ñ</TableHead>
                  <TableHead>?†Ïù∏</TableHead>
                  <TableHead>?¨Ïö©??/TableHead>
                  <TableHead>?†Ìö®Í∏∞Í∞Ñ</TableHead>
                  <TableHead>?ÅÌÉú</TableHead>
                  <TableHead>?ëÏóÖ</TableHead>
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
                          ÏµúÎ? {coupon.maxDiscount.toLocaleString()}??
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {coupon.currentUsage} / {coupon.maxUsage}
                      </div>
                      <div className="text-xs text-gray-500">
                        ?¨Ïö©?êÎãπ {coupon.maxUsagePerUser}??
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
              {editingCoupon ? 'Ïø†Ìè∞ ?òÏ†ï' : '??Ïø†Ìè∞ ?ùÏÑ±'}
            </DialogTitle>
            <DialogDescription>
              ?†Ïù∏ Ïø†Ìè∞???ÅÏÑ∏ ?ïÎ≥¥Î•??ÖÎ†•?òÏÑ∏??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ïø†Ìè∞ ÏΩîÎìú</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="WELCOME20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ïø†Ìè∞Î™?/label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="?†Í∑ú Í∞Ä???†Ïù∏"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">?§Î™Ö</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ïø†Ìè∞ ?¨Ïö© Ï°∞Í±¥Í≥??úÌÉù???§Î™Ö?òÏÑ∏??
              />
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">?†Ïù∏ ?†Ìòï</label>
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
                    <SelectItem value="percentage">?ºÏÑº???†Ïù∏</SelectItem>
                    <SelectItem value="fixed_amount">?ïÏï° ?†Ïù∏</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">?†Ïù∏ Í∞?/label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  placeholder={formData.discountType === 'percentage' ? '20' : '5000'}
                />
              </div>
              <div>
                <label className="text-sm font-medium">ÏµúÎ? ?†Ïù∏</label>
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
                <label className="text-sm font-medium">?ÑÏ≤¥ ?¨Ïö© ?úÎèÑ</label>
                <Input
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">?¨Ïö©?êÎãπ ?úÎèÑ</label>
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
                <label className="text-sm font-medium">?†Ìö® ?úÏûë??/label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">?†Ìö® Ï¢ÖÎ£å??/label>
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
                <label className="text-sm font-medium">ÏµúÏÜå Í≤∞Ï†ú Í∏àÏï°</label>
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
              Ï∑®ÏÜå
            </Button>
            <Button
              onClick={editingCoupon ? handleUpdateCoupon : handleCreateCoupon}
            >
              {editingCoupon ? '?òÏ†ï' : '?ùÏÑ±'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
