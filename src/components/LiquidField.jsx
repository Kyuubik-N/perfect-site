import React from 'react'

export default function LiquidField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* мягкий blob с маской */}
      <div
        className="absolute top-28 left-10 w-[28rem] h-[28rem] animate-float"
        style={{
          background:
            'radial-gradient(closest-side, rgba(182,255,227,.55), rgba(182,255,227,.25) 60%, transparent 70%)',
          filter: 'blur(40px)',
          maskImage: 'radial-gradient(closest-side, black 55%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(closest-side, black 55%, transparent 72%)',
        }}
      />
      <div
        className="absolute bottom-20 right-24 w-[34rem] h-[34rem] animate-spin-slow"
        style={{
          background:
            'radial-gradient(closest-side, rgba(111,232,190,.5), rgba(79,212,166,.25) 65%, transparent 75%)',
          filter: 'blur(48px)',
          maskImage: 'radial-gradient(closest-side, black 50%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(closest-side, black 50%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-[22rem] h-[22rem] animate-float"
        style={{
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(214,255,240,.35), rgba(168,230,207,.10))',
          filter: 'blur(52px)',
          mixBlendMode: 'soft-light',
          opacity: 0.9,
          maskImage: 'radial-gradient(closest-side, black 58%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(closest-side, black 58%, transparent 72%)',
        }}
      />
    </div>
  )
}
