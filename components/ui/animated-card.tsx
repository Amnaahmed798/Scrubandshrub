'use client';

import { ReactNode, useState } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  animateOnMount?: boolean;
}

export default function AnimatedCard({
  children,
  className = '',
  hoverEffect = true,
  animateOnMount = true
}: AnimatedCardProps) {
  const [mounted, setMounted] = useState(false);

  // Trigger animation on mount
  useState(() => {
    if (animateOnMount) {
      setTimeout(() => setMounted(true), 10);
    }
  });

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out transform
        ${animateOnMount && mounted ? 'opacity-100 translate-y-0' : animateOnMount ? 'opacity-0 translate-y-4' : 'opacity-100'}
        ${hoverEffect ? 'hover:shadow-lg hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}