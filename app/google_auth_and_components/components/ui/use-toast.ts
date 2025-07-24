"use client"

import { useState } from "react"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    // In a real implementation, this would manage toast state
    // For our demo, we'll just log to console
    console.log("Toast:", props.title, props.description)

    // In a real app, you would add the toast to state
    setToasts((current) => [...current, props])
  }

  return {
    toast,
    toasts,
  }
}
