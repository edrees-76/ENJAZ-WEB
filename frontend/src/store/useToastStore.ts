import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type Toast = {
  id: string
  type: ToastType
  message: string
  duration: number
  action?: ToastAction
}

type ToastState = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void
  removeToast: (id: string) => void
}

const MAX_TOASTS = 5

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID()

    // Prevent duplicates
    const isDuplicate = get().toasts.some(t => t.message === toast.message)
    if (isDuplicate) return

    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000
    }

    const updated = [...get().toasts, newToast].slice(-MAX_TOASTS)

    set({ toasts: updated })

    setTimeout(() => {
      get().removeToast(id)
    }, newToast.duration)
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }))
  }
}))
