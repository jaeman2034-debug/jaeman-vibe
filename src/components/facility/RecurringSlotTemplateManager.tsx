import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FacilityReservationService } from "@/services/facilityReservationService";
import type { SlotTemplate, SlotGenerationRequest } from "@/types/facility";
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
  Calendar,
  Clock,
  Users,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Play,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface RecurringSlotTemplateManagerProps {
  facilityId: string;
  className?: string;
}

export function RecurringSlotTemplateManager({
  facilityId,
  className = ""
}: RecurringSlotTemplateManagerProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SlotTemplate | null>(null);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    maxCapacity: 10,
    price: 30000,
    isRecurring: true,
    recurrencePattern: "weekly" as const,
    excludeDates: [] as string[]
  });

  // Generation states
  const [generationData, setGenerationData] = useState({
    startDate: "",
    endDate: "",
    excludeDates: [] as string[],
    overrideSettings: {
      price: 0,
      capacity: 0,
      status: "available" as const
    }
  });

  useEffect(() => {
    if (facilityId) {
      loadTemplates();
    }
  }, [facilityId]);

  async function loadTemplates() {
    setLoading(true);
    try {
      // This would typically come from a template service
      // For now, we'll create mock data
      const mockTemplates: SlotTemplate[] = [
        {
          id: "template-1",
          facilityId,
          name: "?�일 ?�전 축구",
          description: "?�일 ?�전 축구 ?�롯",
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "10:00",
          maxCapacity: 20,
          price: 25000,
          isActive: true,
          isRecurring: true,
          recurrencePattern: "weekly",
          excludeDates: [],
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        },
        {
          id: "template-2",
          facilityId,
          name: "주말 ?�후 ?�니??,
          description: "주말 ?�후 ?�니???�롯",
          dayOfWeek: 6, // Saturday
          startTime: "14:00",
          endTime: "16:00",
          maxCapacity: 8,
          price: 40000,
          isActive: true,
          isRecurring: true,
          recurrencePattern: "weekly",
          excludeDates: [],
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error("?�플�?로드 ?�패:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      maxCapacity: 10,
      price: 30000,
      isRecurring: true,
      recurrencePattern: "weekly",
      excludeDates: []
    });
    setEditingTemplate(null);
  }

  function handleCreateTemplate() {
    // This would typically save to the database
    const newTemplate: SlotTemplate = {
      id: `template-${Date.now()}`,
      facilityId,
      ...formData,
      isActive: true,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };

    setTemplates([...templates, newTemplate]);
    setShowCreateModal(false);
    resetForm();
  }

  function handleUpdateTemplate() {
    if (!editingTemplate) return;

    const updatedTemplates = templates.map(template =>
      template.id === editingTemplate.id
        ? { ...template, ...formData, updatedAt: new Date() as any }
        : template
    );

    setTemplates(updatedTemplates);
    setShowCreateModal(false);
    resetForm();
  }

  function handleDeleteTemplate(templateId: string) {
    if (confirm("???�플릿을 ??��?�시겠습?�까?")) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  }

  function handleEditTemplate(template: SlotTemplate) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      dayOfWeek: template.dayOfWeek,
      startTime: template.startTime,
      endTime: template.endTime,
      maxCapacity: template.maxCapacity,
      price: template.price,
      isRecurring: template.isRecurring,
      recurrencePattern: template.recurrencePattern || "weekly",
      excludeDates: template.excludeDates || []
    });
    setShowCreateModal(true);
  }

  async function handleGenerateSlots() {
    if (!generationData.startDate || !generationData.endDate) {
      alert("?�작?�과 종료?�을 ?�력?�주?�요.");
      return;
    }

    setGenerating(true);
    try {
      const request: SlotGenerationRequest = {
        facilityId,
        templateId: editingTemplate?.id || "",
        startDate: generationData.startDate,
        endDate: generationData.endDate,
        excludeDates: generationData.excludeDates,
        overrideSettings: generationData.overrideSettings.price > 0 || 
                         generationData.overrideSettings.capacity > 0 ||
                         generationData.overrideSettings.status !== "available"
          ? generationData.overrideSettings
          : undefined
      };

      const result = await FacilityReservationService.generateRecurringSlots(
        request.templateId,
        request.startDate,
        request.endDate,
        request.excludeDates
      );

      if (result.success) {
        alert(`${result.generatedCount}개의 ?�롯???�성?�었?�니??`);
        setShowGenerateModal(false);
        setGenerationData({
          startDate: "",
          endDate: "",
          excludeDates: [],
          overrideSettings: { price: 0, capacity: 0, status: "available" }
        });
      } else {
        alert(`?�롯 ?�성 ?�패: ${result.error}`);
      }
    } catch (error) {
      console.error("?�롯 ?�성 ?�패:", error);
      alert("?�롯 ?�성???�패?�습?�다.");
    } finally {
      setGenerating(false);
    }
  }

  function getDayOfWeekLabel(day: number): string {
    const days = ["??, "??, "??, "??, "�?, "�?, "??];
    return days[day];
  }

  function getRecurrencePatternLabel(pattern: string): string {
    switch (pattern) {
      case "weekly": return "매주";
      case "biweekly": return "격주";
      case "monthly": return "매월";
      default: return pattern;
    }
  }

  function calculateDuration(start: string, end: string): string {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}?�간 ${diffMinutes > 0 ? diffMinutes + '�? : ''}`;
    }
    return `${diffMinutes}�?;
  }

  function addExcludeDate() {
    const date = prompt("?�외???�짜�??�력?�세??(YYYY-MM-DD ?�식):");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormData(prev => ({
        ...prev,
        excludeDates: [...prev.excludeDates, date]
      }));
    }
  }

  function removeExcludeDate(date: string) {
    setFormData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates.filter(d => d !== date)
    }));
  }

  function addGenerationExcludeDate() {
    const date = prompt("?�외???�짜�??�력?�세??(YYYY-MM-DD ?�식):");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setGenerationData(prev => ({
        ...prev,
        excludeDates: [...prev.excludeDates, date]
      }));
    }
  }

  function removeGenerationExcludeDate(date: string) {
    setGenerationData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates.filter(d => d !== date)
    }));
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>반복 ?�롯 ?�플�?관�?/CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">로그?�이 ?�요?�니??</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">반복 ?�롯 ?�플�?관�?/h2>
          <p className="text-gray-600 mt-1">
            ?�기?�으�??�성?�는 ?�롯???�플릿을 관리하?�요
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          ???�플�?
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {template.description && (
                <p className="text-sm text-gray-600">{template.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Schedule Info */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {getDayOfWeekLabel(template.dayOfWeek)}?�일
                </span>
                <Badge variant="outline" className="ml-auto">
                  {getRecurrencePatternLabel(template.recurrencePattern || "weekly")}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {template.startTime} - {template.endTime}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  ({calculateDuration(template.startTime, template.endTime)})
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">최�? {template.maxCapacity}�?/span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">??template.price.toLocaleString()}</span>
              </div>

              {/* Exclude Dates */}
              {template.excludeDates && template.excludeDates.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">?�외 ?�짜:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.excludeDates.map((date, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {date}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={template.isActive ? "default" : "secondary"}>
                  {template.isActive ? "?�성" : "비활??}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowGenerateModal(true);
                  }}
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  ?�롯 ?�성
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "?�플�??�정" : "???�플�??�성"}
            </DialogTitle>
            <DialogDescription>
              반복 ?�롯??기본 ?�보�??�정?�세??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?�플릿명 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="?? ?�일 ?�전 축구"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?�일 *
                </label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">?�요??/SelectItem>
                    <SelectItem value="1">?�요??/SelectItem>
                    <SelectItem value="2">?�요??/SelectItem>
                    <SelectItem value="3">?�요??/SelectItem>
                    <SelectItem value="4">목요??/SelectItem>
                    <SelectItem value="5">금요??/SelectItem>
                    <SelectItem value="6">?�요??/SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?�명
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="?�플릿에 ?�???�명???�력?�세??
                rows={2}
              />
            </div>

            {/* Time and Capacity */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?�작 ?�간 *
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 ?�간 *
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?�용 ?�원 *
                </label>
                <Input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) }))}
                  min="1"
                />
              </div>
            </div>

            {/* Price and Recurrence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가�?*
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  min="0"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반복 ?�턴 *
                </label>
                <Select
                  value={formData.recurrencePattern}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, recurrencePattern: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">매주</SelectItem>
                    <SelectItem value="biweekly">격주</SelectItem>
                    <SelectItem value="monthly">매월</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exclude Dates */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  ?�외 ?�짜
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExcludeDate}
                >
                  <Plus className="w-4 h-4" />
                  추�?
                </Button>
              </div>
              {formData.excludeDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.excludeDates.map((date, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {date}
                      <button
                        onClick={() => removeExcludeDate(date)}
                        className="ml-1 hover:text-red-600"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">?�외???�짜가 ?�습?�다</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              취소
            </Button>
            <Button
              onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
              disabled={!formData.name || !formData.startTime || !formData.endTime}
            >
              {editingTemplate ? "?�정" : "?�성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Slots Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>?�롯 ?�성</DialogTitle>
            <DialogDescription>
              ?�플릿을 기반?�로 ?�제 ?�롯???�성?�세??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?�작??*
                </label>
                <Input
                  type="date"
                  value={generationData.startDate}
                  onChange={(e) => setGenerationData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료??*
                </label>
                <Input
                  type="date"
                  value={generationData.endDate}
                  onChange={(e) => setGenerationData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Override Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">?�정???�정 (?�택?�항)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">가�?/label>
                  <Input
                    type="number"
                    value={generationData.overrideSettings.price}
                    onChange={(e) => setGenerationData(prev => ({
                      ...prev,
                      overrideSettings: {
                        ...prev.overrideSettings,
                        price: parseInt(e.target.value) || 0
                      }
                    }))}
                    placeholder="기본�??�용"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">?�용 ?�원</label>
                  <Input
                    type="number"
                    value={generationData.overrideSettings.capacity}
                    onChange={(e) => setGenerationData(prev => ({
                      ...prev,
                      overrideSettings: {
                        ...prev.overrideSettings,
                        capacity: parseInt(e.target.value) || 0
                      }
                    }))}
                    placeholder="기본�??�용"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">?�태</label>
                  <Select
                    value={generationData.overrideSettings.status}
                    onValueChange={(value: any) => setGenerationData(prev => ({
                      ...prev,
                      overrideSettings: {
                        ...prev.overrideSettings,
                        status: value
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">?�약 가??/SelectItem>
                      <SelectItem value="maintenance">?��? �?/SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Exclude Dates */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  ?�성 ?�외 ?�짜
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGenerationExcludeDate}
                >
                  <Plus className="w-4 h-4" />
                  추�?
                </Button>
              </div>
              {generationData.excludeDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {generationData.excludeDates.map((date, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {date}
                      <button
                        onClick={() => removeGenerationExcludeDate(date)}
                        className="ml-1 hover:text-red-600"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">?�외???�짜가 ?�습?�다</p>
              )}
            </div>

            {/* Preview */}
            {generationData.startDate && generationData.endDate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">?�성 ?�정 ?�롯</h4>
                <p className="text-sm text-gray-600">
                  {generationData.startDate}부??{generationData.endDate}까�?
                  {editingTemplate && ` ${getDayOfWeekLabel(editingTemplate.dayOfWeek)}?�일마다`}
                  ?�롯???�성?�니??
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              취소
            </Button>
            <Button
              onClick={handleGenerateSlots}
              disabled={generating || !generationData.startDate || !generationData.endDate}
              className="flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ?�성 �?..
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  ?�롯 ?�성
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
