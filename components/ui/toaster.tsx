"use client";

import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Toast as ToastPrimitive } from "@/components/ui/toast";
import { ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <ToastPrimitive key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </ToastPrimitive>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
