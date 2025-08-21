import React, { useState, useEffect } from 'react';
import { getUid } from '../../lib/auth';
import { 
  updateItemStatus, 
  canUpdateStatus, 
  canChangeToStatus,
  getStatusDisplayInfo,
  type ItemStatus 
} from '../../services/marketStatusService';
import type { MarketItem } from '../../features/market/types';

interface StatusChangeModalProps {
  item: MarketItem;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: ItemStatus) => void;
}

export default function StatusChangeModal({ 
  item, 
  isOpen, 
  onClose, 
  onStatusChange 
}: StatusChangeModalProps) {
  const uid = getUid();
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>(item.status);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // 권한 확인
  useEffect(() => {
    if (isOpen && uid && item.id) {
      checkPermission();
    }
  }, [isOpen, uid, item.id]);

  const checkPermission = async () => {
    try {
      const permission = await canUpdateStatus(item.id!, uid);
      setHasPermission(permission);
    } catch (error) {
      console.error('권한 확인 실패:', error);
      setHasPermission(false);
    }
  };

  // 상태 변경 처리
  const handleStatusChange = async () => {
    if (!uid || !item.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateItemStatus(item.id, uid, selectedStatus, reason.trim() || undefined);
      
      // 성공 시 콜백 호출
      onStatusChange(selectedStatus);
      onClose();
      
      // 상태 초기화
      setSelectedStatus(item.status);
      setReason('');
      
    } catch (error: any) {
      setError(error.message || '상태 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    if (!isLoading) {
      setSelectedStatus(item.status);
      setReason('');
      setError(null);
      onClose();
    }
  };

  // 권한이 없는 경우
  if (!hasPermission) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">권한이 없습니다</h3>
            <p className="text-gray-600 mb-6">
              본인의 상품만 상태를 변경할 수 있습니다.
            </p>
            <button
              onClick={handleClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 현재 상태에서 변경 가능한 상태들
  const availableStatuses = ['active', 'reserved', 'sold'].filter(status => 
    status !== item.status && canChangeToStatus(item.status, status as ItemStatus)
  ) as ItemStatus[];

  // 변경 가능한 상태가 없는 경우
  if (availableStatuses.length === 0) {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">상태 변경 불가</h3>
            <p className="text-gray-600 mb-6">
              현재 상태에서는 다른 상태로 변경할 수 없습니다.
            </p>
            <button
              onClick={handleClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">상품 상태 변경</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 상품 정보 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                📷
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 line-clamp-2">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.price.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 현재 상태 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">현재 상태</label>
          <div className="p-3 bg-gray-100 rounded-lg">
            {(() => {
              const statusInfo = getStatusDisplayInfo(item.status);
              return (
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: statusInfo.backgroundColor,
                      color: statusInfo.color
                    }}
                  >
                    {statusInfo.text}
                  </span>
                  <span className="text-sm text-gray-600">{statusInfo.description}</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 새 상태 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">새 상태 선택</label>
          <div className="space-y-2">
            {availableStatuses.map((status) => {
              const statusInfo = getStatusDisplayInfo(status);
              return (
                <label
                  key={status}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStatus === status
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value as ItemStatus)}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: statusInfo.backgroundColor,
                          color: statusInfo.color
                        }}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 사유 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            변경 사유 (선택사항)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="상태 변경 사유를 입력하세요..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {reason.length}/200
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleStatusChange}
            disabled={isLoading || selectedStatus === item.status}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                변경 중...
              </div>
            ) : (
              '상태 변경'
            )}
          </button>
        </div>

        {/* 주의사항 */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-yellow-600 text-sm">⚠️</div>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">주의사항</p>
              <ul className="text-xs space-y-1">
                <li>• 상태 변경은 되돌릴 수 없습니다</li>
                <li>• 예약중으로 변경하면 다른 구매자에게 표시되지 않습니다</li>
                <li>• 판매완료로 변경하면 상품이 비활성화됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 