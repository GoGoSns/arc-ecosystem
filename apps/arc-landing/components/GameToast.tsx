'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'win' | 'loss' | 'info';

interface GameToastProps {
  isVisible: boolean;
  type: ToastType;
  title: string;
  message: string;
  amount?: string;
  onClose: () => void;
}

const Confetti = () => {
  const pieces = Array.from({ length: 50 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      {pieces.map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: ['#d4af37', '#f0f0f5', '#8a8a9a', '#b8860b'][Math.floor(Math.random() * 4)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
          }}
        />
      ))}
    </div>
  );
};

export const GameToast: React.FC<GameToastProps> = ({
  isVisible,
  type,
  title,
  message,
  amount,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      {type === 'win' && <Confetti />}
      
      <div 
        className={`relative max-w-md w-full p-8 rounded-3xl border-2 text-center animate-win
          ${type === 'win' ? 'bg-[#0d0d12] border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.3)]' : 
            type === 'loss' ? 'bg-[#0d0d12] border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 
            'bg-[#0d0d12] border-[#1a1a2e] shadow-2xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          {type === 'win' && (
            <div className="w-20 h-20 mx-auto bg-[#d4af37]/20 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          )}
          {type === 'loss' && (
            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        <h2 className={`text-3xl font-bold mb-2 ${type === 'win' ? 'text-[#d4af37]' : type === 'loss' ? 'text-red-400' : 'text-white'}`}>
          {title}
        </h2>
        
        {amount && (
          <div className="text-5xl font-black my-6 text-white tracking-tight">
            {amount} <span className="text-xl text-[#8a8a9a]">USDC</span>
          </div>
        )}

        <p className="text-[#8a8a9a] text-lg mb-8">
          {message}
        </p>

        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all
            ${type === 'win' ? 'bg-[#d4af37] text-black hover:bg-[#b8860b] shadow-lg shadow-[#d4af37]/20' : 
              type === 'loss' ? 'bg-[#1a1a2e] text-white hover:bg-[#252545]' : 
              'bg-[#1a1a2e] text-white hover:bg-[#252545]'}`}
        >
          {type === 'win' ? 'AWESOME!' : 'CLOSE'}
        </button>
      </div>
    </div>
  );
};
