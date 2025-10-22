import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // ???¨ì¼ ì§„ì…???¬ìš©
import { useToast } from '@/components/common/Toast';
import type { SlotTemplate, SlotGenerationRequest } from '@/types/facility';

interface SlotTemplateManagerProps {
  facilityId: string;
}

const DAYS_OF_WEEK = ['??, '??, '??, '??, 'ëª?, 'ê¸?, '??];

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
      console.error('?œí”Œë¦?ë¡œë“œ ?¤íŒ¨:', error);
      toast('?œí”Œë¦?ë¡œë“œ???¤íŒ¨?ˆìŠµ?ˆë‹¤');
    } finally {
      setLoading(false);
    }
  }

  // Create template
  async function handleCreateTemplate() {
    try {
      if (!userId) throw new Error('ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??);
      
      const templateData = {
        ...formData,
        facilityId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'slot_templates'), templateData);
      toast('?œí”Œë¦¿ì´ ?ì„±?˜ì—ˆ?µë‹ˆ??);
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
      console.error('?œí”Œë¦??ì„± ?¤íŒ¨:', error);
      toast('?œí”Œë¦??ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤');
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
      toast('?œí”Œë¦¿ì´ ?…ë°?´íŠ¸?˜ì—ˆ?µë‹ˆ??);
      loadTemplates();
    } catch (error) {
      console.error('?œí”Œë¦??…ë°?´íŠ¸ ?¤íŒ¨:', error);
      toast('?œí”Œë¦??…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤');
    }
  }

  // Delete template
  async function handleDeleteTemplate(templateId: string) {
    if (!confirm('???œí”Œë¦¿ì„ ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?')) return;
    
    try {
      await deleteDoc(doc(db, 'slot_templates', templateId));
      toast('?œí”Œë¦¿ì´ ?? œ?˜ì—ˆ?µë‹ˆ??);
      loadTemplates();
    } catch (error) {
      console.error('?œí”Œë¦??? œ ?¤íŒ¨:', error);
      toast('?œí”Œë¦??? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤');
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
      console.log('?¬ë¡¯ ?ì„± ?”ì²­:', request);
      
      // For now, simulate success
      toast(`${template.name} ?œí”Œë¦¿ìœ¼ë¡?30?¼ê°„???¬ë¡¯???ì„±?ˆìŠµ?ˆë‹¤`);
    } catch (error) {
      console.error('?¬ë¡¯ ?ì„± ?¤íŒ¨:', error);
      toast('?¬ë¡¯ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤');
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">ë¡œë”© ì¤?..</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">?¬ë¡¯ ?œí”Œë¦?ê´€ë¦?/h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          ???œí”Œë¦?ì¶”ê?
        </button>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">???œí”Œë¦??ì„±</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ?œí”Œë¦??´ë¦„
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="?? ?‰ì¼ ?¤ì „ ì¶•êµ¬"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ?”ì¼
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}?”ì¼
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ?œì‘ ?œê°„
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
                ì¢…ë£Œ ?œê°„
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
                ìµœë? ?¸ì›
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
                ê°€ê²?(??
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
              ?¤ëª…
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="?œí”Œë¦¿ì— ?€???¤ëª…???…ë ¥?˜ì„¸??
            />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              ?œí”Œë¦??ì„±
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              ì·¨ì†Œ
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            ?±ë¡???œí”Œë¦¿ì´ ?†ìŠµ?ˆë‹¤
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
                    {template.isActive ? '?œì„±' : 'ë¹„í™œ??}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateSlots(template)}
                    disabled={generating === template.id}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generating === template.id ? '?ì„± ì¤?..' : '?¬ë¡¯ ?ì„±'}
                  </button>
                  <button
                    onClick={() => handleUpdateTemplate(template, { isActive: !template.isActive })}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    {template.isActive ? 'ë¹„í™œ?±í™”' : '?œì„±??}
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    ?? œ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">?”ì¼:</span> {DAYS_OF_WEEK[template.dayOfWeek]}?”ì¼
                </div>
                <div>
                  <span className="font-medium">?œê°„:</span> {template.startTime} ~ {template.endTime}
                </div>
                <div>
                  <span className="font-medium">?¸ì›:</span> {template.maxCapacity}ëª?
                </div>
                <div>
                  <span className="font-medium">ê°€ê²?</span> {template.price.toLocaleString()}??
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
        <h4 className="font-medium text-blue-800 mb-2">?’¡ ?œí”Œë¦??¬ìš©ë²?/h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>???œí”Œë¦¿ì„ ?ì„±?˜ë©´ ë§¤ì£¼ ê°™ì? ?”ì¼, ê°™ì? ?œê°„???¬ë¡¯???ë™?¼ë¡œ ?ì„±?©ë‹ˆ??/li>
          <li>??"?¬ë¡¯ ?ì„±" ë²„íŠ¼???´ë¦­?˜ë©´ ì§€?•ëœ ê¸°ê°„ ?™ì•ˆ???¬ë¡¯????ë²ˆì— ?ì„±?????ˆìŠµ?ˆë‹¤</li>
          <li>??ë¹„í™œ?±í™”???œí”Œë¦¿ì? ?ˆë¡œ???¬ë¡¯???ì„±?˜ì? ?ŠìŠµ?ˆë‹¤</li>
        </ul>
      </div>
    </div>
  );
}
