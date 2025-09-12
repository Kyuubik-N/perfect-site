import React from 'react'

export default function GlassCard({ className = '', children, ...props }) {
  return (
    <div className={`glass p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
