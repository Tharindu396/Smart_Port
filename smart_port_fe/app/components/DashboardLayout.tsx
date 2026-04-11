"use client";

import React from "react";
import { cn } from "@heroui/react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Topbar } from "./Topbar";
import { useDashboard } from "@/app/hooks/useDashboard";
import { navSections } from "@/app/config/dashboard.config";

interface DashboardLayoutProps {
  children: React.ReactNode;
  defaultActiveKey?: string;
  pageTitle?: string;
  className?: string;
}

/**
 * DashboardLayout
 *
 * A fully responsive dashboard layout with:
 * - Collapsible sidebar (desktop)
 * - Slide-over drawer sidebar (mobile)
 * - Sticky topbar with search, notifications, user menu, theme toggle
 * - State persisted in localStorage
 *
 * Usage:
 * ```tsx
 * <DashboardLayout defaultActiveKey="dashboard" pageTitle="Dashboard">
 *   <YourPageContent />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  defaultActiveKey,
  pageTitle,
  className,
}: DashboardLayoutProps) {
  const {
    sidebarState,
    isMobileOpen,
    activeKey,
    toggleSidebar,
    toggleMobile,
    closeMobile,
    setActiveKey,
  } = useDashboard(defaultActiveKey);

  // Derive page title from active nav item if not provided
  const resolvedTitle =
    pageTitle ??
    navSections
      .flatMap((s) => s.items)
      .find((item) => item.key === activeKey)?.label ??
    "Dashboard";

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", className)}>
      {/* Desktop Sidebar */}
      <Sidebar
        state={sidebarState}
        activeKey={activeKey}
        onToggle={toggleSidebar}
        onNavClick={setActiveKey}
        className="hidden lg:flex"
      />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileOpen}
        activeKey={activeKey}
        onClose={closeMobile}
        onNavClick={setActiveKey}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          onMobileMenuToggle={toggleMobile}
          pageTitle={resolvedTitle}
          className="shrink-0"
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="h-full p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
