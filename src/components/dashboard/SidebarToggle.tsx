"use client";

import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useSidebar } from "./SidebarContext";

export function SidebarToggle() {
  const { toggleDesktop, toggleMobile } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle sidebar"
      onClick={isMobile ? toggleMobile : toggleDesktop}
    >
      <PanelLeft />
    </Button>
  );
}
