"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";

import { cn } from "@/lib/utils";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          className={cn(
            "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm",
          )}
        >
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return (
    <>
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          toast={toast}
          className={cn(
            "pointer-events-auto rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg",
            "data-[type=success]:border-emerald-500/40 data-[type=success]:bg-emerald-500/10 data-[type=success]:text-emerald-600 dark:data-[type=success]:text-emerald-400",
            "data-[type=error]:border-destructive/40 data-[type=error]:text-destructive",
          )}
        >
          <ToastPrimitive.Title className="font-medium" />
          <ToastPrimitive.Description className="text-muted-foreground" />
        </ToastPrimitive.Root>
      ))}
    </>
  );
}

export { ToastPrimitive as Toast };
