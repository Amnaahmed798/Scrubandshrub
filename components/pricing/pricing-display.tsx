'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ConfirmationButton } from './confirmation-button';

interface PricingDisplayProps {
  subtotal: number;
  onConfirmSelections: () => void;
  isConfirmDisabled: boolean;
  className?: string;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
  subtotal,
  onConfirmSelections,
  isConfirmDisabled,
  className
}) => {
  return (
    <div className={cn("bg-gray-50 p-6 rounded-lg border border-gray-200", className)}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-medium text-gray-700">Subtotal:</span>
        <span className="text-2xl font-bold text-gray-900">SAR {subtotal.toFixed(2)}</span>
      </div>

      <ConfirmationButton
        onClick={onConfirmSelections}
        disabled={isConfirmDisabled}
      />
    </div>
  );
};

export { PricingDisplay };