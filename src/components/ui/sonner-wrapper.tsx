"use client"

import { useEffect, useState } from "react"

export function SonnerToasterWrapper() {
  const [mounted, setMounted] = useState(false)
  const [SonnerToaster, setSonnerToaster] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    setMounted(true)
    // Only import on client side after mount
    if (typeof window !== 'undefined') {
      import("./sonner").then((mod) => {
        setSonnerToaster(() => mod.Toaster)
      })
    }
  }, [])

  if (!mounted || !SonnerToaster) {
    return null
  }

  return <SonnerToaster />
}

