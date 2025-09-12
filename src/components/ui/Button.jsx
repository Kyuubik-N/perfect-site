import React from 'react'

export default function Button({
  as: asProp = 'button',
  variant = 'default',
  className = '',
  ...props
}) {
  const base = 'btn'
  const map = {
    default: '',
    primary: 'btn-primary',
    ghost: 'btn-ghost',
  }
  const Comp = asProp
  return <Comp className={[base, map[variant], className].join(' ')} {...props} />
}
