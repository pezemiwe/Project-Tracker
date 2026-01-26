import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-4 sm:right-4 sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = {
  default: {
    container: "border-border bg-background text-foreground",
    icon: "text-foreground",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    container: "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20 dark:text-destructive-foreground",
    icon: "text-destructive",
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
  },
  info: {
    container: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
}

interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: keyof typeof toastVariants
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantStyles = toastVariants[variant]

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all duration-320 ease-industrial",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
        "data-[state=open]:animate-slide-in-right data-[state=closed]:animate-fade-out",
        "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        variantStyles.container,
        className
      )}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-sm font-medium uppercase tracking-wider transition-colors duration-320",
      "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-command-blue focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "group-[.success]:border-success-green/30 group-[.success]:hover:bg-success-green/20",
      "group-[.error]:border-critical-red/30 group-[.error]:hover:bg-critical-red/20",
      "group-[.warning]:border-warning-amber/30 group-[.warning]:hover:bg-warning-amber/20",
      "group-[.info]:border-command-blue/30 group-[.info]:hover:bg-command-blue/20",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-all duration-320",
      "hover:text-foreground hover:bg-muted focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-command-blue",
      "group-hover:opacity-100",
      "group-[.success]:text-success-green/50 group-[.success]:hover:text-success-green",
      "group-[.error]:text-critical-red/50 group-[.error]:hover:text-critical-red",
      "group-[.warning]:text-warning-amber/50 group-[.warning]:hover:text-warning-amber",
      "group-[.info]:text-command-blue/50 group-[.info]:hover:text-command-blue",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
