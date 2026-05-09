import React from 'react';

export const EgmanLogo = ({ size = 64, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="padGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffb703" />
        <stop offset="100%" stopColor="#fb8500" />
      </linearGradient>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000000" floodOpacity="0.6"/>
      </filter>
    </defs>
    <path d="M 25 110 A 85 85 0 1 1 175 110" fill="none" stroke="#ea580c" strokeWidth="8" strokeLinecap="round" />
    <path d="M 40 140 A 65 65 0 0 0 160 140" fill="none" stroke="#0284c7" strokeWidth="8" strokeLinecap="round" />
    <path d="M 55 65 L 70 15 L 100 45 L 130 15 L 145 65 Z" fill="url(#crownGrad)" stroke="#b45309" strokeWidth="3" strokeLinejoin="round" />
    <path d="M 30 100 C 30 65, 170 65, 170 100 C 170 120, 160 155, 140 165 C 130 170, 120 150, 110 140 C 105 135, 95 135, 90 140 C 80 150, 70 170, 60 165 C 40 155, 30 120, 30 100 Z" fill="url(#padGrad)" stroke="#9a3412" strokeWidth="2" filter="url(#glow)" />
    <path d="M 45 95 h 12 v -12 h 10 v 12 h 12 v 10 h -12 v 12 h -10 v -12 h -12 z" fill="#b45309" />
    <path d="M 47 97 h 8 v -8 h 6 v 8 h 8 v 6 h -8 v 8 h -6 v -8 h -8 z" fill="#facc15" />
    <circle cx="140" cy="83" r="6" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
    <circle cx="154" cy="97" r="6" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" />
    <circle cx="140" cy="111" r="6" fill="#0ea5e9" stroke="#0369a1" strokeWidth="1" />
    <circle cx="126" cy="97" r="6" fill="#facc15" stroke="#a16207" strokeWidth="1" />
    <circle cx="75" cy="128" r="14" fill="#374151" stroke="#111827" strokeWidth="3" />
    <circle cx="75" cy="128" r="7" fill="#4b5563" />
    <circle cx="125" cy="128" r="14" fill="#374151" stroke="#111827" strokeWidth="3" />
    <circle cx="125" cy="128" r="7" fill="#4b5563" />
  </svg>
);
