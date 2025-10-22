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
          name: "?âÏùº ?§Ï†Ñ Ï∂ïÍµ¨",
          description: "?âÏùº ?§Ï†Ñ Ï∂ïÍµ¨ ?¨Î°Ø",
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
          name: "Ï£ºÎßê ?§ÌõÑ ?åÎãà??,
          description: "Ï£ºÎßê ?§ÌõÑ ?åÎãà???¨Î°Ø",
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
      console.error("?úÌîåÎ¶?Î°úÎìú ?§Ìå®:", error);
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
    if (confirm("???úÌîåÎ¶øÏùÑ ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?")) {
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
      alert("?úÏûë?ºÍ≥º Ï¢ÖÎ£å?ºÏùÑ ?ÖÎ†•?¥Ï£º?∏Ïöî.");
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
        alert(`${result.generatedCount}Í∞úÏùò ?¨Î°Ø???ùÏÑ±?òÏóà?µÎãà??`);
        setShowGenerateModal(false);
        setGenerationData({
          startDate: "",
          endDate: "",
          excludeDates: [],
          overrideSettings: { price: 0, capacity: 0, status: "available" }
        });
      } else {
        alert(`?¨Î°Ø ?ùÏÑ± ?§Ìå®: ${result.error}`);
      }
    } catch (error) {
      console.error("?¨Î°Ø ?ùÏÑ± ?§Ìå®:", error);
      alert("?¨Î°Ø ?ùÏÑ±???§Ìå®?àÏäµ?àÎã§.");
    } finally {
      setGenerating(false);
    }
  }

  function getDayOfWeekLabel(day: number): string {
    const days = ["??, "??, "??, "??, "Î™?, "Í∏?, "??];
    return days[day];
  }

  function getRecurrencePatternLabel(pattern: string): string {
    switch (pattern) {
      case "weekly": return "Îß§Ï£º";
      case "biweekly": return "Í≤©Ï£º";
      case "monthly": return "Îß§Ïõî";
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
      return `${diffHours}?úÍ∞Ñ ${diffMinutes > 0 ? diffMinutes + 'Î∂? : ''}`;
    }
    return `${diffMinutes}Î∂?;
  }

  function addExcludeDate() {
    const date = prompt("?úÏô∏???†ÏßúÎ•??ÖÎ†•?òÏÑ∏??(YYYY-MM-DD ?ïÏãù):");
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
    const date = prompt("?úÏô∏???†ÏßúÎ•??ÖÎ†•?òÏÑ∏??(YYYY-MM-DD ?ïÏãù):");
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
          <CardTitle>Î∞òÎ≥µ ?¨Î°Ø ?úÌîåÎ¶?Í¥ÄÎ¶?/CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Î°úÍ∑∏?∏Ïù¥ ?ÑÏöî?©Îãà??</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Î∞òÎ≥µ ?¨Î°Ø ?úÌîåÎ¶?Í¥ÄÎ¶?/h2>
          <p className="text-gray-600 mt-1">
            ?ïÍ∏∞?ÅÏúºÎ°??ùÏÑ±?òÎäî ?¨Î°Ø???úÌîåÎ¶øÏùÑ Í¥ÄÎ¶¨Ìïò?∏Ïöî
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          ???úÌîåÎ¶?
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
                  {getDayOfWeekLabel(template.dayOfWeek)}?îÏùº
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
                <span className="text-gray-600">ÏµúÎ? {template.maxCapacity}Î™?/span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">??template.price.toLocaleString()}</span>
              </div>

              {/* Exclude Dates */}
              {template.excludeDates && template.excludeDates.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">?úÏô∏ ?†Ïßú:</p>
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
                  {template.isActive ? "?úÏÑ±" : "ÎπÑÌôú??}
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
                  ?¨Î°Ø ?ùÏÑ±
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
              {editingTemplate ? "?úÌîåÎ¶??òÏ†ï" : "???úÌîåÎ¶??ùÏÑ±"}
            </DialogTitle>
            <DialogDescription>
              Î∞òÎ≥µ ?¨Î°Ø??Í∏∞Î≥∏ ?ïÎ≥¥Î•??§Ï†ï?òÏÑ∏??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?úÌîåÎ¶øÎ™Ö *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="?? ?âÏùº ?§Ï†Ñ Ï∂ïÍµ¨"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?îÏùº *
                </label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">?ºÏöî??/SelectItem>
                    <SelectItem value="1">?îÏöî??/SelectItem>
                    <SelectItem value="2">?îÏöî??/SelectItem>
                    <SelectItem value="3">?òÏöî??/SelectItem>
                    <SelectItem value="4">Î™©Ïöî??/SelectItem>
                    <SelectItem value="5">Í∏àÏöî??/SelectItem>
                    <SelectItem value="6">?†Ïöî??/SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ?§Î™Ö
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="?úÌîåÎ¶øÏóê ?Ä???§Î™Ö???ÖÎ†•?òÏÑ∏??
                rows={2}
              />
            </div>

            {/* Time and Capacity */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?úÏûë ?úÍ∞Ñ *
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ï¢ÖÎ£å ?úÍ∞Ñ *
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?òÏö© ?∏Ïõê *
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
                  Í∞ÄÍ≤?*
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
                  Î∞òÎ≥µ ?®ÌÑ¥ *
                </label>
                <Select
                  value={formData.recurrencePattern}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, recurrencePattern: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Îß§Ï£º</SelectItem>
                    <SelectItem value="biweekly">Í≤©Ï£º</SelectItem>
                    <SelectItem value="monthly">Îß§Ïõî</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exclude Dates */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  ?úÏô∏ ?†Ïßú
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExcludeDate}
                >
                  <Plus className="w-4 h-4" />
                  Ï∂îÍ?
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
                <p className="text-sm text-gray-500">?úÏô∏???†ÏßúÍ∞Ä ?ÜÏäµ?àÎã§</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Ï∑®ÏÜå
            </Button>
            <Button
              onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
              disabled={!formData.name || !formData.startTime || !formData.endTime}
            >
              {editingTemplate ? "?òÏ†ï" : "?ùÏÑ±"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Slots Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>?¨Î°Ø ?ùÏÑ±</DialogTitle>
            <DialogDescription>
              ?úÌîåÎ¶øÏùÑ Í∏∞Î∞ò?ºÎ°ú ?§Ï†ú ?¨Î°Ø???ùÏÑ±?òÏÑ∏??
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ?úÏûë??*
                </label>
                <Input
                  type="date"
                  value={generationData.startDate}
                  onChange={(e) => setGenerationData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ï¢ÖÎ£å??*
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
              <h4 className="text-sm font-medium text-gray-700 mb-3">?¨Ï†ï???§Ï†ï (?†ÌÉù?¨Ìï≠)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Í∞ÄÍ≤?/label>
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
                    placeholder="Í∏∞Î≥∏Í∞??¨Ïö©"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">?òÏö© ?∏Ïõê</label>
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
                    placeholder="Í∏∞Î≥∏Í∞??¨Ïö©"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">?ÅÌÉú</label>
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
                      <SelectItem value="available">?àÏïΩ Í∞Ä??/SelectItem>
                      <SelectItem value="maintenance">?êÍ? Ï§?/SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Exclude Dates */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  ?ùÏÑ± ?úÏô∏ ?†Ïßú
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGenerationExcludeDate}
                >
                  <Plus className="w-4 h-4" />
                  Ï∂îÍ?
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
                <p className="text-sm text-gray-500">?úÏô∏???†ÏßúÍ∞Ä ?ÜÏäµ?àÎã§</p>
              )}
            </div>

            {/* Preview */}
            {generationData.startDate && generationData.endDate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">?ùÏÑ± ?àÏ†ï ?¨Î°Ø</h4>
                <p className="text-sm text-gray-600">
                  {generationData.startDate}Î∂Ä??{generationData.endDate}ÍπåÏ?
                  {editingTemplate && ` ${getDayOfWeekLabel(editingTemplate.dayOfWeek)}?îÏùºÎßàÎã§`}
                  ?¨Î°Ø???ùÏÑ±?©Îãà??
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Ï∑®ÏÜå
            </Button>
            <Button
              onClick={handleGenerateSlots}
              disabled={generating || !generationData.startDate || !generationData.endDate}
              className="flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ?ùÏÑ± Ï§?..
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  ?¨Î°Ø ?ùÏÑ±
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
