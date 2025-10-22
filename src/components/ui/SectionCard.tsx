import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, children, right, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {right && <div>{right}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
