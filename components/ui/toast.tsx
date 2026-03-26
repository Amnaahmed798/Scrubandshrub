"use client"

import * as React from "react"

type ToastVariant = "default" | "destructive"

type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  action?: React.ReactNode
  duration?: number
}

const ToastContext = React.createContext<{
  toasts: ToastProps[]
  toast: (props: Omit<ToastProps, "id" | "open">) => void
  removeToast: (id: string) => void
}>({
  toasts: [],
  toast: () => {},
  removeToast: () => {},
})

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: Omit<ToastProps, "id" | "open">) => {
    const id = Math.random().toString(36).substring(2)
    setToasts((prev) => [...prev, { ...props, id }])
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

type ToastElementProps = ToastProps & {
  onClose: () => void
}

const ToastElement = ({ id, title, description, variant, action, onClose }: ToastElementProps) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const isDestructive = variant === "destructive"

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg ${
      isDestructive
        ? "border-red-500 bg-red-50 dark:bg-red-900"
        : "bg-white dark:bg-gray-800"
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold ${isDestructive ? "text-red-900 dark:text-red-100" : "text-gray-900 dark:text-white"}`}>
              {title}
            </h4>
          )}
          {description && (
            <p className={`mt-1 text-sm ${isDestructive ? "text-red-700 dark:text-red-200" : "text-gray-600 dark:text-gray-300"}`}>
              {description}
            </p>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
        <button
          onClick={onClose}
          className={`ml-4 ${isDestructive ? "text-red-400 hover:text-red-600" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
        >
          &times;
        </button>
      </div>
    </div>
  )
}

export const Toaster = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastElement
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
