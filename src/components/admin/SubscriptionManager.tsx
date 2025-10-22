import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FacilityReservationService } from "@/services/facilityReservationService";
import type { Subscription, SubscriptionPlan, SubscriptionStats } from "@/types/facility";
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
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Crown,
  Star
} from "lucide-react";

interface SubscriptionManagerProps {
  className?: string;
}

export function SubscriptionManager({ className = "" }: SubscriptionManagerProps) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showCreateSubscriptionModal, setShowCreateSubscriptionModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Plan form states
  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    planType: 'basic' as 'basic' | 'premium' | 'enterprise',
    creditsPerCycle: 0,
    maxCreditsRollover: 0,
    pricePerCycle: 0,
    cycleType: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    maxDailyBookings: 1,
    advanceBookingDays: 3,
    priorityBooking: false,
    exclusiveSlots: false,
    discountPercentage: 0,
    maxFacilities: 1,
    maxConcurrentBookings: 1
  });

  // Subscription form states
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    userId: '',
    planId: '',
    cycleStartDate: '',
    autoRenew: true
  });

  useEffect(() => {
    if (user) {
      loadSubscriptionPlans();
      loadSubscriptions();
      loadSubscriptionStats();
    }
  }, [user]);

  async function loadSubscriptionPlans() {
    setLoading(true);
    try {
      // This would typically call a service method to get plans
      // For now, we'll use mock data
      const mockPlans: SubscriptionPlan[] = [
        {
          id: 'basic-daily',
          name: 'Basic Daily',
          description: '?ºÏùº Í∏∞Î≥∏ Î©§Î≤Ñ??,
          planType: 'basic',
          creditsPerCycle: 2,
          maxCreditsRollover: 4,
          pricePerCycle: 5000,
          currency: 'KRW',
          cycleType: 'daily',
          maxDailyBookings: 2,
          advanceBookingDays: 3,
          priorityBooking: false,
          exclusiveSlots: false,
          discountPercentage: 0,
          maxFacilities: 1,
          maxConcurrentBookings: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'premium-monthly',
          name: 'Premium Monthly',
          description: '?îÍ∞Ñ ?ÑÎ¶¨ÎØ∏ÏóÑ Î©§Î≤Ñ??,
          planType: 'premium',
          creditsPerCycle: 30,
          maxCreditsRollover: 60,
          pricePerCycle: 50000,
          currency: 'KRW',
          cycleType: 'monthly',
          maxDailyBookings: 5,
          advanceBookingDays: 14,
          priorityBooking: true,
          exclusiveSlots: false,
          discountPercentage: 15,
          maxFacilities: 3,
          maxConcurrentBookings: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setSubscriptionPlans(mockPlans);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscriptions() {
    try {
      // This would typically call a service method to get subscriptions
      // For now, we'll use mock data
      const mockSubscriptions: Subscription[] = [
        {
          id: 'sub-1',
          userId: 'user-1',
          planId: 'premium-monthly',
          planName: 'Premium Monthly',
          planType: 'premium',
          status: 'active',
          creditsPerCycle: 30,
          currentCredits: 15,
          totalCreditsUsed: 45,
          cycleType: 'monthly',
          cycleStartDate: '2024-01-01',
          nextRefillDate: '2024-02-01',
          renewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          pricePerCycle: 50000,
          currency: 'KRW',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastRefillAt: new Date().toISOString(),
          autoRenew: true,
          maxDailyBookings: 5,
          advanceBookingDays: 14,
          priorityBooking: true,
          exclusiveSlots: false
        }
      ];
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }

  async function loadSubscriptionStats() {
    try {
      const stats = await FacilityReservationService.getSubscriptionStats();
      setSubscriptionStats(stats);
    } catch (error) {
      console.error('Error loading subscription stats:', error);
    }
  }

  function resetPlanForm() {
    setPlanFormData({
      name: '',
      description: '',
      planType: 'basic',
      creditsPerCycle: 0,
      maxCreditsRollover: 0,
      pricePerCycle: 0,
      cycleType: 'monthly',
      maxDailyBookings: 1,
      advanceBookingDays: 3,
      priorityBooking: false,
      exclusiveSlots: false,
      discountPercentage: 0,
      maxFacilities: 1,
      maxConcurrentBookings: 1
    });
  }

  function resetSubscriptionForm() {
    setSubscriptionFormData({
      userId: '',
      planId: '',
      cycleStartDate: '',
      autoRenew: true
    });
  }

  function handleCreatePlan() {
    // Implementation for creating plan
    console.log('Creating plan:', planFormData);
    setShowCreatePlanModal(false);
    resetPlanForm();
    loadSubscriptionPlans();
  }

  function handleUpdatePlan() {
    // Implementation for updating plan
    console.log('Updating plan:', planFormData);
    setShowCreatePlanModal(false);
    setEditingPlan(null);
    resetPlanForm();
    loadSubscriptionPlans();
  }

  function handleDeletePlan(planId: string) {
    if (confirm('?ïÎßêÎ°????åÎûú????†ú?òÏãúÍ≤†Ïäµ?àÍπå?')) {
      // Implementation for deleting plan
      console.log('Deleting plan:', planId);
      loadSubscriptionPlans();
    }
  }

  function handleEditPlan(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      description: plan.description,
      planType: plan.planType,
      creditsPerCycle: plan.creditsPerCycle,
      maxCreditsRollover: plan.maxCreditsRollover,
      pricePerCycle: plan.pricePerCycle,
      cycleType: plan.cycleType,
      maxDailyBookings: plan.maxDailyBookings,
      advanceBookingDays: plan.advanceBookingDays,
      priorityBooking: plan.priorityBooking,
      exclusiveSlots: plan.exclusiveSlots,
      discountPercentage: plan.discountPercentage,
      maxFacilities: plan.maxFacilities,
      maxConcurrentBookings: plan.maxConcurrentBookings
    });
    setShowCreatePlanModal(true);
  }

  function handleCreateSubscription() {
    // Implementation for creating subscription
    console.log('Creating subscription:', subscriptionFormData);
    setShowCreateSubscriptionModal(false);
    resetSubscriptionForm();
    loadSubscriptions();
  }

  function handleUpdateSubscription() {
    // Implementation for updating subscription
    console.log('Updating subscription:', subscriptionFormData);
    setShowCreateSubscriptionModal(false);
    setEditingSubscription(null);
    resetSubscriptionForm();
    loadSubscriptions();
  }

  function getPlanTypeIcon(planType: string) {
    switch (planType) {
      case 'basic':
        return <Users className="w-4 h-4" />;
      case 'premium':
        return <Star className="w-4 h-4" />;
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  }

  function getPlanTypeColor(planType: string) {
    switch (planType) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge variant="default">?úÏÑ±</Badge>;
      case 'paused':
        return <Badge variant="secondary">?ºÏãú?ïÏ?</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Ï∑®ÏÜå??/Badge>;
      case 'expired':
        return <Badge variant="destructive">ÎßåÎ£å??/Badge>;
      default:
        return <Badge variant="outline">?????ÜÏùå</Badge>;
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Î©§Î≤Ñ??Íµ¨ÎèÖ Í¥ÄÎ¶?/h2>
          <p className="text-gray-600">Íµ¨ÎèÖ ?åÎûúÍ≥??¨Ïö©??Î©§Î≤Ñ??ùÑ Í¥ÄÎ¶¨Ìïò?∏Ïöî</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            ?µÍ≥Ñ Î≥¥Í∏∞
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCreateSubscriptionModal(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Íµ¨ÎèÖ ?ùÏÑ±
          </Button>
          <Button onClick={() => setShowCreatePlanModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            ???åÎûú ?ùÏÑ±
          </Button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && subscriptionStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Íµ¨ÎèÖ ?µÍ≥Ñ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Ï¥?Íµ¨ÎèÖ</h4>
                <p className="text-2xl font-bold">{subscriptionStats.totalSubscriptions}</p>
                <p className="text-sm text-gray-600">
                  ?úÏÑ±: {subscriptionStats.activeSubscriptions}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Ï¥??¨Î†à??/h4>
                <p className="text-2xl font-bold">{subscriptionStats.totalCreditsIssued}</p>
                <p className="text-sm text-gray-600">
                  ?¨Ïö©?? {subscriptionStats.totalCreditsUsed}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">?âÍ∑† ?¨Î†à??/h4>
                <p className="text-2xl font-bold">
                  {Math.round(subscriptionStats.averageCreditsPerUser)}
                </p>
                <p className="text-sm text-gray-600">?¨Ïö©?êÎãπ</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">?åÎûú Î∂ÑÌè¨</h4>
                <div className="space-y-1">
                  {Object.entries(subscriptionStats.planDistribution).map(([plan, count]) => (
                    <div key={plan} className="flex justify-between text-sm">
                      <span className="capitalize">{plan}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Íµ¨ÎèÖ ?åÎûú</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Î°úÎî© Ï§?..</div>
          ) : subscriptionPlans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ?±Î°ù???åÎûú???ÜÏäµ?àÎã§.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <div key={plan.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPlanTypeIcon(plan.planType)}
                      <Badge className={getPlanTypeColor(plan.planType)}>
                        {plan.planType}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>?¨Î†à??Ï£ºÍ∏∞:</span>
                      <span className="font-medium">{plan.creditsPerCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Í∞ÄÍ≤?Ï£ºÍ∏∞:</span>
                      <span className="font-medium">
                        {plan.pricePerCycle.toLocaleString()}??
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ï£ºÍ∏∞:</span>
                      <span className="font-medium capitalize">{plan.cycleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>?†Ïù∏:</span>
                      <span className="font-medium">{plan.discountPercentage}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>?òÎ£® {plan.maxDailyBookings}Í±?/span>
                      <span>??/span>
                      <span>{plan.advanceBookingDays}?????àÏïΩ</span>
                      {plan.priorityBooking && (
                        <>
                          <span>??/span>
                          <span className="text-blue-600">?∞ÏÑ† ?àÏïΩ</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>?¨Ïö©??Íµ¨ÎèÖ</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ?±Î°ù??Íµ¨ÎèÖ???ÜÏäµ?àÎã§.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>?¨Ïö©??/TableHead>
                  <TableHead>?åÎûú</TableHead>
                  <TableHead>?ÅÌÉú</TableHead>
                  <TableHead>?¨Î†à??/TableHead>
                  <TableHead>?§Ïùå Î¶¨ÌïÑ</TableHead>
                  <TableHead>?ëÏóÖ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="font-medium">User {subscription.userId}</div>
                      <div className="text-sm text-gray-500">
                        {subscription.planName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanTypeColor(subscription.planType)}>
                        {subscription.planType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{subscription.currentCredits} / {subscription.creditsPerCycle}</div>
                        <div className="text-gray-500">
                          ?¨Ïö©?? {subscription.totalCreditsUsed}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(subscription.nextRefillDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {subscription.autoRenew ? '?êÎèô Í∞±Ïã†' : '?òÎèô Í∞±Ïã†'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSubscription(subscription);
                            setSubscriptionFormData({
                              userId: subscription.userId,
                              planId: subscription.planId,
                              cycleStartDate: subscription.cycleStartDate,
                              autoRenew: subscription.autoRenew
                            });
                            setShowCreateSubscriptionModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Create/Edit Plan Modal */}
      <Dialog open={showCreatePlanModal} onOpenChange={setShowCreatePlanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? '?åÎûú ?òÏ†ï' : '???åÎûú ?ùÏÑ±'}
            </DialogTitle>
            <DialogDescription>
              Íµ¨ÎèÖ ?åÎûú???ÅÏÑ∏ ?ïÎ≥¥Î•??ÖÎ†•?òÏÑ∏??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">?åÎûúÎ™?/label>
                <Input
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  placeholder="Premium Monthly"
                />
              </div>
              <div>
                <label className="text-sm font-medium">?åÎûú ?†Ìòï</label>
                <Select
                  value={planFormData.planType}
                  onValueChange={(value: 'basic' | 'premium' | 'enterprise') =>
                    setPlanFormData({ ...planFormData, planType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">?§Î™Ö</label>
              <Textarea
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                placeholder="?åÎûú???πÏßïÍ≥??úÌÉù???§Î™Ö?òÏÑ∏??
              />
            </div>

            {/* Credit Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Ï£ºÍ∏∞Î≥??¨Î†à??/label>
                <Input
                  type="number"
                  value={planFormData.creditsPerCycle}
                  onChange={(e) => setPlanFormData({ ...planFormData, creditsPerCycle: Number(e.target.value) })}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="text-sm font-medium">ÏµúÎ? ?¥Ïõî ?¨Î†à??/label>
                <Input
                  type="number"
                  value={planFormData.maxCreditsRollover}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxCreditsRollover: Number(e.target.value) })}
                  placeholder="60"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Í∞ÄÍ≤?Ï£ºÍ∏∞</label>
                <Input
                  type="number"
                  value={planFormData.pricePerCycle}
                  onChange={(e) => setPlanFormData({ ...planFormData, pricePerCycle: Number(e.target.value) })}
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Í≤∞Ï†ú Ï£ºÍ∏∞</label>
                <Select
                  value={planFormData.cycleType}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') =>
                    setPlanFormData({ ...planFormData, cycleType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">?ºÍ∞Ñ</SelectItem>
                    <SelectItem value="weekly">Ï£ºÍ∞Ñ</SelectItem>
                    <SelectItem value="monthly">?îÍ∞Ñ</SelectItem>
                    <SelectItem value="yearly">?∞Í∞Ñ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">?†Ïù∏??(%)</label>
                <Input
                  type="number"
                  value={planFormData.discountPercentage}
                  onChange={(e) => setPlanFormData({ ...planFormData, discountPercentage: Number(e.target.value) })}
                  placeholder="15"
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">?òÎ£® ÏµúÎ? ?àÏïΩ</label>
                <Input
                  type="number"
                  value={planFormData.maxDailyBookings}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxDailyBookings: Number(e.target.value) })}
                  placeholder="5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">?¨Ï†Ñ ?àÏïΩ ?ºÏàò</label>
                <Input
                  type="number"
                  value={planFormData.advanceBookingDays}
                  onChange={(e) => setPlanFormData({ ...planFormData, advanceBookingDays: Number(e.target.value) })}
                  placeholder="14"
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ÏµúÎ? ?úÏÑ§ ??/label>
                <Input
                  type="number"
                  value={planFormData.maxFacilities}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxFacilities: Number(e.target.value) })}
                  placeholder="3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">?ôÏãú ?àÏïΩ ??/label>
                <Input
                  type="number"
                  value={planFormData.maxConcurrentBookings}
                  onChange={(e) => setPlanFormData({ ...planFormData, maxConcurrentBookings: Number(e.target.value) })}
                  placeholder="3"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlanModal(false)}>
              Ï∑®ÏÜå
            </Button>
            <Button
              onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
            >
              {editingPlan ? '?òÏ†ï' : '?ùÏÑ±'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Subscription Modal */}
      <Dialog open={showCreateSubscriptionModal} onOpenChange={setShowCreateSubscriptionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? 'Íµ¨ÎèÖ ?òÏ†ï' : '??Íµ¨ÎèÖ ?ùÏÑ±'}
            </DialogTitle>
            <DialogDescription>
              ?¨Ïö©??Íµ¨ÎèÖ ?ïÎ≥¥Î•??ÖÎ†•?òÏÑ∏??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">?¨Ïö©??ID</label>
              <Input
                value={subscriptionFormData.userId}
                onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, userId: e.target.value })}
                placeholder="user-123"
              />
            </div>

            <div>
              <label className="text-sm font-medium">?åÎûú</label>
              <Select
                value={subscriptionFormData.planId}
                onValueChange={(value) => setSubscriptionFormData({ ...subscriptionFormData, planId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="?åÎûú???†ÌÉù?òÏÑ∏?? />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.pricePerCycle.toLocaleString()}??
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Íµ¨ÎèÖ ?úÏûë??/label>
              <Input
                type="date"
                value={subscriptionFormData.cycleStartDate}
                onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, cycleStartDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSubscriptionModal(false)}>
              Ï∑®ÏÜå
            </Button>
            <Button
              onClick={editingSubscription ? handleUpdateSubscription : handleCreateSubscription}
            >
              {editingSubscription ? '?òÏ†ï' : '?ùÏÑ±'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
