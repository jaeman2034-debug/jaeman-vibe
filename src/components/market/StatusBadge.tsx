import React from 'react';
import { getStatusDisplayInfo, type ItemStatus } from '../../services/marketStatusService';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export default function StatusBadge({ 
  status, 
  size = 'md', 
  showDescription = false,
  className = ''
}: StatusBadgeProps) {
  const statusInfo = getStatusDisplayInfo(status);

  // 크기별 스타일
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default: // md
        return 'px-3 py-1.5 text-sm';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`${getSizeStyles()} font-medium rounded-full`}
        style={{
          backgroundColor: statusInfo.backgroundColor,
          color: statusInfo.color
        }}
      >
        {statusInfo.text}
      </span>
      
      {showDescription && (
        <span className="text-gray-600 text-sm">
          {statusInfo.description}
        </span>
      )}
    </div>
  );
}

// 상태별 아이콘과 함께 표시하는 확장 컴포넌트
export function StatusBadgeWithIcon({ 
  status, 
  size = 'md',
  showDescription = false,
  className = ''
}: StatusBadgeProps) {
  const statusInfo = getStatusDisplayInfo(status);

  // 상태별 아이콘
  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'reserved':
        return '🟡';
      case 'sold':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm">{getStatusIcon()}</span>
      <StatusBadge 
        status={status} 
        size={size} 
        showDescription={showDescription} 
      />
    </div>
  );
}

// 상태 변경 가능 여부를 표시하는 컴포넌트
export function StatusBadgeWithAction({ 
  status, 
  size = 'md',
  onStatusChange,
  canChange = false,
  className = ''
}: StatusBadgeProps & {
  onStatusChange?: () => void;
  canChange?: boolean;
}) {
  const statusInfo = getStatusDisplayInfo(status);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <StatusBadge status={status} size={size} />
      
      {canChange && onStatusChange && (
        <button
          onClick={onStatusChange}
          className="text-blue-600 hover:text-blue-700 text-xs underline"
          title="상태 변경"
        >
          변경
        </button>
      )}
    </div>
  );
} 