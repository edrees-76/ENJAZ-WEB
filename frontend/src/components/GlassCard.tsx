import React, { useRef, useEffect } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
}

export const GlassCard = ({ children, className = '', enableTilt = false }: GlassCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableTilt) return;
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 30; // 30 is less aggressive than login
      const rotateY = (centerX - x) / 30;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
      card.style.zIndex = '10';
    };

    const handleMouseLeave = () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      card.style.zIndex = '1';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableTilt]);

  return (
    <div 
      ref={cardRef}
      className={`glass-card p-6 transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div style={{ transform: enableTilt ? 'translateZ(20px)' : 'none' }}>
        {children}
      </div>
    </div>
  );
};

