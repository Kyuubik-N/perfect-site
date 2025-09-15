import React from 'react'

export default function GlassCard({ className = '', children }) {
  return <div className={`card shadow-soft ${className}`}>{children}</div>
}
