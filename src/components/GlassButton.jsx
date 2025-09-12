import React from 'react'

export default function GlassButton({ as: asProp = 'button', className = '', ...props }) {
  const Comp = asProp
  return <Comp className={`glass-button focus-ring ${className}`} {...props} />
}
