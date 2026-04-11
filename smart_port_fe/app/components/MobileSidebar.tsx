"use client";

import React from "react";
import { Button, Chip, cn } from "@heroui/react";
import { X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { navSections, siteConfig } from "@/app/config/dashboard.config";

interface MobileSidebarProps {
  isOpen: boolean;
  activeKey: string;
  onClose: () => void;
  onNavClick: (key: string) => void;
}

export function MobileSidebar({
  isOpen,
  activeKey,
  onClose,
  onNavClick,
}: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          "transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
          "bg-content1 border-r border-divider shadow-xl",
          "transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              {siteConfig.logo}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{siteConfig.name}</p>
              <p className="text-xs text-default-400">v{siteConfig.version}</p>
            </div>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={onClose}
            aria-label="Close menu"
            className="text-default-400"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {section.title && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-default-400">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => {
                      onNavClick(item.key);
                      onClose();
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-default-600 hover:bg-default-100 hover:text-foreground"
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <Chip
                        size="sm"
                        variant="soft"
                        color={isActive ? "accent" : "default"}
                        className="h-5 px-1 text-[10px]"
                      >
                        {item.badge}
                      </Chip>
                    )}
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-divider p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-default-400 truncate">john@acme.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
