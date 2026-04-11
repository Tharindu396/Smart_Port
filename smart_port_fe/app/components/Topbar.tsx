"use client";

import {
  Button,
  SearchField,
  Dropdown,
  Avatar,
  cn,
  Switch,
  Label
} from "@heroui/react";
import {
  Menu,
  Sun,
  Moon,
  Settings,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";

interface TopbarProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
  className?: string;
}

export function Topbar({
  onMobileMenuToggle,
  pageTitle = "Dashboard",
  className,
}: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 w-full border-b border-divider bg-content1/80 backdrop-blur-md",
        className
      )}
    >
      <header className="flex h-16 items-center justify-between px-4 gap-3">
        
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            isIconOnly
            variant="primary"
            size="sm"
            onPress={onMobileMenuToggle}
            aria-label="Open navigation menu"
            className="text-default-500 lg:hidden"
          >
            <Menu size={20} />
          </Button>

          {/* Page title */}
          {pageTitle && (
            <h1 className="hidden md:block text-base font-semibold text-foreground">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* CENTER - Search */}
        <div className="hidden sm:flex flex-1 justify-center max-w-lg">
          <SearchField name="search" variant="secondary" fullWidth={true} >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input className="w-70" placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-1">
          
          {/* Mobile search
          <Tooltip>
            <Tooltip.Trigger>
              <Button isIconOnly variant="primary" size="sm" className="text-default-500">
                <Search size={18} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              Search
            </Tooltip.Content>
          </Tooltip> */}

          {/* Theme toggle */}
          <div className="flex gap-3">
            <Switch
              size="lg"
              isSelected={isDark}
              onChange={(selected: boolean) => setTheme(selected ? "dark" : "light")}
              aria-label="Toggle dark mode"
            >
              {({ isSelected }) => (
                <Switch.Control className={isSelected ? "bg-gray-500/80" : ""}>
                  <Switch.Thumb>
                    <Switch.Icon color="gray">
                      {isSelected ? (
                        <Sun className="size-3 text-inherit opacity-100" />
                      ) : (
                        <Moon className="size-3 text-inherit opacity-70" />
                      )}
                    </Switch.Icon>
                  </Switch.Thumb>
                </Switch.Control>
              )}
            </Switch>
          </div>

          {/* User menu */}
           <Dropdown>
            <Dropdown.Trigger className="rounded-full">
              <Avatar>
                <Avatar.Image
                  alt="Junior Garcia"
                  src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg"
                />
                <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
              </Avatar>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <Avatar.Image
                      alt="Jane"
                      src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg"
                    />
                    <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col gap-0">
                    <p className="text-sm leading-5 font-medium">Jane Doe</p>
                    <p className="text-xs leading-none text-muted">jane@example.com</p>
                  </div>
                </div>
              </div>
              <Dropdown.Menu>
                <Dropdown.Item id="dashboard" textValue="Dashboard">
                  <Label>Dashboard</Label>
                </Dropdown.Item>
                <Dropdown.Item id="profile" textValue="Profile">
                  <Label>Profile</Label>
                </Dropdown.Item>
                <Dropdown.Item id="settings" textValue="Settings">
                  <div className="flex w-full items-center justify-between gap-2">
                    <Label>Settings</Label>
                    <Settings className="size-3.5 text-muted" />
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                  <div className="flex w-full items-center justify-between gap-2">
                    <Label>Log Out</Label>
                    <LogOut className="size-3.5 text-danger" />
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>
    </nav>
  );
}