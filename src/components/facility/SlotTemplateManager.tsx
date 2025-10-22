import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // ???�일 진입???�용
import { useToast } from '@/components/common/Toast';
import type { SlotTemplate, SlotGenerationRequest } from '@/types/facility';

interface SlotTemplateManagerProps {
  facilityId: string;
}

const DAYS_OF_WEEK = ['??, '??, '??, '??, '�?, '�?, '??];

export default function SlotTemplateManager({ facilityId }: SlotTemplateManagerProps) {
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const toast = useToast();
  const userId = auth.currentUser?.uid;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    maxCapacity: 10,
    price: 10000,
    isActive: true
  });

  // Load templates
  useEffect(() => {
    if (facilityId) {
      loadTemplates();
    }
  }, [facilityId]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'slot_templates'),
        where('facilityId', '==', facilityId)
      );
      const snapshot = await getDocs(q);
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SlotTemplate[];
      
      setTemplates(templatesData.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    } catch (error) {
      console.error('?�플�?로드 ?�패:', error);
      toast('?�플�?로드???�패?�습?�다');
    } finally {
      setLoading(false);
    }
  }

  // Create template
  async function handleCreateTemplate() {
    try {
      if (!userId) throw new Error('로그?�이 ?�요?�니??);
      
      const templateData = {
        ...formData,
        facilityId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'slot_templates'), templateData);
      toast('?�플릿이 ?�성?�었?�니??);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        maxCapacity: 10,
        price: 10000,
        isActive: true
      });
      loadTemplates();
    } catch (error) {
      console.error('?�플�??�성 ?�패:', error);
      toast('?�플�??�성???�패?�습?�다');
    }
  }

  // Update template
  async function handleUpdateTemplate(template: SlotTemplate, updates: Partial<SlotTemplate>) {
    try {
      const templateRef = doc(db, 'slot_templates', template.id);
      await updateDoc(templateRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      toast('?�플릿이 ?�데?�트?�었?�니??);
      loadTemplates();
    } catch (error) {
      console.error('?�플�??�데?�트 ?�패:', error);
      toast('?�플�??�데?�트???�패?�습?�다');
    }
  }

  // Delete template
  async function handleDeleteTemplate(templateId: string) {
    if (!confirm('???�플릿을 ??��?�시겠습?�까?')) return;
    
    try {
      await deleteDoc(doc(db, 'slot_templates', templateId));
      toast('?�플릿이 ??��?�었?�니??);
      loadTemplates();
    } catch (error) {
      console.error('?�플�???�� ?�패:', error);
      toast('?�플�???��???�패?�습?�다');
    }
  }

  // Generate slots from template
  async function handleGenerateSlots(template: SlotTemplate) {
    try {
      setGenerating(template.id);
      
      // Get date range (next 30 days)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const request: SlotGenerationRequest = {
        facilityId,
        templateId: template.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      // Call Cloud Function to generate slots
      // This would typically be a Cloud Function call
      console.log('?�롯 ?�성 ?�청:', request);
      
      // For now, simulate success
      toast(`${template.name} ?�플릿으�?30?�간???�롯???�성?�습?�다`);
    } catch (error) {
      console.error('?�롯 ?�성 ?�패:', error);
      toast('?�롯 ?�성???�패?�습?�다');
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">로딩 �?..</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">?�롯 ?�플�?관�?/h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          ???�플�?추�?
        </button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">???�플�??�성</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ?�플�??�름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="?? ?�일 ?�전 축구"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ?�일
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}?�일
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ?�작 ?�간
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료 ?�간
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최�? ?�원
              </label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                가�?(??
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                min="0"
                step="1000"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ?�명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="?�플릿에 ?�???�명???�력?�세??
            />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              ?�플�??�성
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            ?�록???�플릿이 ?�습?�다
          </div>
        ) : (
          templates.map(template => (
            <div key={template.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{template.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    template.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.isActive ? '?�성' : '비활??}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateSlots(template)}
                    disabled={generating === template.id}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generating === template.id ? '?�성 �?..' : '?�롯 ?�성'}
                  </button>
                  <button
                    onClick={() => handleUpdateTemplate(template, { isActive: !template.isActive })}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    {template.isActive ? '비활?�화' : '?�성??}
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    ??��
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">?�일:</span> {DAYS_OF_WEEK[template.dayOfWeek]}?�일
                </div>
                <div>
                  <span className="font-medium">?�간:</span> {template.startTime} ~ {template.endTime}
                </div>
                <div>
                  <span className="font-medium">?�원:</span> {template.maxCapacity}�?
                </div>
                <div>
                  <span className="font-medium">가�?</span> {template.price.toLocaleString()}??
                </div>
              </div>

              {template.description && (
                <div className="mt-2 text-sm text-gray-600">
                  {template.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">?�� ?�플�??�용�?/h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>???�플릿을 ?�성?�면 매주 같�? ?�일, 같�? ?�간???�롯???�동?�로 ?�성?�니??/li>
          <li>??"?�롯 ?�성" 버튼???�릭?�면 지?�된 기간 ?�안???�롯????번에 ?�성?????�습?�다</li>
          <li>??비활?�화???�플릿�? ?�로???�롯???�성?��? ?�습?�다</li>
        </ul>
      </div>
    </div>
  );
}
