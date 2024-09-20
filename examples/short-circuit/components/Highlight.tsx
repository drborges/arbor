import React from "react"

import { useAnimatedClassName } from "../hooks/useAnimatedClassName"

export function Highlight({
  key,
  children,
  label,
}: {
  key: number
  children: React.ReactNode
  label: string
}) {
  const className = useAnimatedClassName(key)
  return (
    <div className={`highlight ${className}`}>
      <span>{label}</span>
      {children}
    </div>
  )
}
