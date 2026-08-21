import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey?: string;
  className?: string;
  variant?: 'slide-up' | 'slide-x' | 'fade';
}

export default function PageTransition({
  children,
  transitionKey,
  className = 'w-full flex-1 flex flex-col',
  variant = 'slide-up',
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = {
    'slide-up': {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
    },
    'slide-x': {
      initial: { opacity: 0, x: 12 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -8 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  };

  const selectedVariant = variants[variant] || variants['slide-up'];

  return (
    <motion.div
      key={transitionKey}
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1], // fluid, responsive ease-out curve
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
