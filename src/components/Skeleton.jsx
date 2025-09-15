import React from 'react'

export default function Skeleton({ lines = 3 }) {
  return (
    <div className="card p-5">
      <div className="skel h-5 w-1/3"></div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skel h-4 w-full"></div>
        ))}
      </div>
    </div>
  )
}
