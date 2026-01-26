import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

const variantIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={5000} swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        const Icon = variantIcons[variant]

        return (
          <Toast key={id} variant={variant} {...props} className={variant}>
            <div className="flex items-start gap-3 w-full">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>

              {/* Content */}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>

              {/* Action */}
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
