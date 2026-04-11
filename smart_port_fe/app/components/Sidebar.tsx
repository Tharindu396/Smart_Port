"use client";

import React from "react";
import { Button, Chip, cn } from "@heroui/react";
import { PanelLeftClose, PanelLeftOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { navSections, siteConfig } from "@/app/config/dashboard.config";
import { SidebarState } from "@/app/hooks/useDashboard";

interface SidebarProps {
  state: SidebarState;
  activeKey: string;
  onToggle: () => void;
  onNavClick: (key: string) => void;
  className?: string;
}

export function Sidebar({
  state,
  activeKey,
  onToggle,
  onNavClick,
  className,
}: SidebarProps) {
  const isExpanded = state === "expanded";
  const isCollapsed = state === "collapsed";

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-content1 border-r border-divider",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "w-64" : "w-16",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 px-3 border-b border-divider shrink-0",
          isExpanded ? "justify-between" : "justify-center"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-lg shrink-0">
            {siteConfig.logo}
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-foreground truncate leading-tight">
                {siteConfig.name}
              </span>
              <span className="text-xs text-default-400">v{siteConfig.version}</span>
            </div>
          )}
        </div>

        {isExpanded && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={onToggle}
              aria-label="Collapse sidebar"
              className="shrink-0 text-default-400 hover:text-foreground"
            >
              <PanelLeftClose size={16} />
            </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-divider">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={onToggle}
              aria-label="Expand sidebar"
              className="text-default-400 hover:text-foreground"
            >
              <PanelLeftOpen size={16} />
            </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {/* Section title */}
            {section.title && isExpanded && (
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-default-400">
                {section.title}
              </p>
            )}
            {section.title && isCollapsed && sectionIdx > 0 && (
              <div className="my-2 border-t border-divider" />
            )}

            {/* Nav items */}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;

              const navItem = (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => onNavClick(item.key)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg",
                    "text-sm font-medium transition-colors duration-150",
                    "hover:bg-default-100",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-default-600 hover:text-foreground",
                    !isExpanded && "justify-center px-0 w-10 mx-auto"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn("shrink-0", isActive ? "text-primary" : "")}
                  />
                  {isExpanded && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {isExpanded && item.badge !== undefined && (
                    <Chip
                      size="sm"
                      variant="soft"
                      color={isActive ? "accent" : "default"}
                      className="h-5 min-w-[20px] px-1 text-[10px]"
                    >
                      {item.badge}
                    </Chip>
                  )}
                  {isExpanded && isActive && !item.badge && (
                    <ChevronRight size={14} className="text-primary shrink-0" />
                  )}
                </Link>
              );

              if (isCollapsed) {
                return navItem;
              }

              return navItem;
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user area */}
      <div className={cn("shrink-0 border-t border-divider p-3", !isExpanded && "flex justify-center")}>
        {isExpanded ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-default-100 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary shrink-0 flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate leading-tight">John Doe</p>
              <p className="text-xs text-default-400 truncate">john@acme.com</p>
            </div>
            <ChevronRight size={14} className="text-default-400 shrink-0" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary cursor-pointer flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
        )}
      </div>
    </aside>
  );
}
