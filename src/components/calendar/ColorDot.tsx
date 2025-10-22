import React from "react";

interface ColorDotProps {
  color: string;
  className?: string;
}

export default function ColorDot({ color, className = "" }: ColorDotProps) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full mr-2 ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

