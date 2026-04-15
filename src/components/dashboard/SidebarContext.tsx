"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = {
  desktopCollapsed: boolean;
  toggleDesktop: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const value = {
    desktopCollapsed,
    toggleDesktop: () => setDesktopCollapsed((v) => !v),
    mobileOpen,
    setMobileOpen,
    toggleMobile: () => setMobileOpen((v) => !v),
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
