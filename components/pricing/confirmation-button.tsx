'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ConfirmationButtonProps {
  onClick: () => void;
  disabled: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ConfirmationButton: React.FC<ConfirmationButtonProps> = ({
  onClick,
  disabled,
  className,
  children = 'Confirm Selections'
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-3 px-4 rounded-lg font-medium",
        disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-yellow-500 text-white hover:bg-yellow-600',
        className
      )}
    >
      {children}
    </button>
  );
};

export { ConfirmationButton };