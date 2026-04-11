"use client";

import { useState, useCallback, useEffect } from "react";

export type SidebarState = "expanded" | "collapsed" | "hidden";

interface DashboardState {
  sidebarState: SidebarState;
  isMobileOpen: boolean;
  activeKey: string;
}

interface UseDashboardReturn extends DashboardState {
  toggleSidebar: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  setActiveKey: (key: string) => void;
  setSidebarState: (state: SidebarState) => void;
  isExpanded: boolean;
  isCollapsed: boolean;
}

const SIDEBAR_STORAGE_KEY = "dashboard:sidebar-state";

export function useDashboard(defaultActiveKey = "dashboard"): UseDashboardReturn {
  const [sidebarState, setSidebarStateInternal] = useState<SidebarState>("expanded");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  // Restore sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY) as SidebarState | null;
    if (stored && ["expanded", "collapsed"].includes(stored)) {
      setSidebarStateInternal(stored);
    }
  }, []);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setSidebarState = useCallback((state: SidebarState) => {
    setSidebarStateInternal(state);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, state);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarState(sidebarState === "expanded" ? "collapsed" : "expanded");
  }, [sidebarState, setSidebarState]);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return {
    sidebarState,
    isMobileOpen,
    activeKey,
    toggleSidebar,
    toggleMobile,
    closeMobile,
    setActiveKey,
    setSidebarState,
    isExpanded: sidebarState === "expanded",
    isCollapsed: sidebarState === "collapsed",
  };
}
