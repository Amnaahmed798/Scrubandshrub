'use client';

import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const startTime = Date.now();
    const startValue = parseFloat(element.textContent || '0');
    const targetValue = value;
    const increment = targetValue - startValue;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 2);
      const currentValue = startValue + increment * easeOut;

      element.textContent = `${prefix}${Math.floor(currentValue)}${suffix}`;

      if (progress >= 1) {
        clearInterval(timer);
        element.textContent = `${prefix}${targetValue}${suffix}`;
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [value, duration, prefix, suffix]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}