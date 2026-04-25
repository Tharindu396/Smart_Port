"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Switch,
  TextArea,
} from "@heroui/react";

export default function SettingsPage() {
  return (
    <DashboardLayout defaultActiveKey="settings" pageTitle="Settings">
      <section className="space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Workspace Settings</h2>
            <p className="text-sm text-default-500">
              Manage account details, system behavior, and operational defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="warning" >
              2 pending changes
            </Chip>
            <Button variant="primary">Save Changes</Button>
          </div>
        </header>

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* ORG PROFILE */}
          <Card className="xl:col-span-2" variant="default">
            <Card.Header className="flex justify-between items-start">
              <div>
                <Card.Title>Organization Profile</Card.Title>
                <Card.Description>
                  Visible metadata for your port dashboard
                </Card.Description>
              </div>
              <Chip size="sm" color="success" >
                Active
              </Chip>
            </Card.Header>

            <Card.Content className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input aria-labelaria-label="Port Name" defaultValue="Smart Port HQ" />
                <Input
                  aria-label="Support Email"
                  type="email"
                  defaultValue="support@smartport.io"
                />
              </div>

              <Input
                aria-label="Operations Contact"
                defaultValue="+91 98765 43210"
              />

              <TextArea
                aria-label="About"
                defaultValue="Real-time monitoring and vessel traffic control for harbor operations."
                minLength={3}
              />
            </Card.Content>
          </Card>

          {/* ADMIN CARD */}
          <Card variant="secondary">
            <Card.Header>
              <Card.Title>Admin</Card.Title>
            </Card.Header>

            <Card.Content className="space-y-4">
              <div className="flex items-center gap-3">
                 <Avatar size="lg">
                  <Avatar.Image alt="John Doe" src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg" />
                </Avatar>
                
                <div>
                  <p className="text-sm font-medium">Jane Doe</p>
                  <p className="text-xs text-default-500">
                    Port Operations Admin
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-default-500">Role</p>
                <p className="font-medium">Super Admin</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-default-500">Last Login</p>
                <p className="font-medium">Today, 09:12 AM</p>
              </div>

              <Button variant="primary">
                Manage Access
              </Button>
            </Card.Content>
          </Card>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* SYSTEM PREFS */}
          <Card variant="default">
            <Card.Header>
              <Card.Title>System Preferences</Card.Title>
            </Card.Header>

            <Card.Content className="space-y-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Auto-refresh vessel feed
                  </p>
                  <p className="text-xs text-default-500">
                    Fetch latest AIS updates every 30 seconds
                  </p>
                </div>
                <Switch defaultSelected />
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Enable maintenance mode banner
                  </p>
                  <p className="text-xs text-default-500">
                    Show warning banner to all operators
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Archive historical logs
                  </p>
                  <p className="text-xs text-default-500">
                    Move logs older than 90 days to cold storage
                  </p>
                </div>
                <Switch defaultSelected />
              </div>
            </Card.Content>
          </Card>

          {/* SECURITY */}
          <Card variant="tertiary">
            <Card.Header className="flex justify-between items-center">
              <Card.Title>Security Controls</Card.Title>
              <Chip size="sm" color="danger" >
                High Impact
              </Chip>
            </Card.Header>

            <Card.Content className="space-y-4">
              <Switch defaultSelected>
                Require 2FA for administrators
              </Switch>

              <Switch defaultSelected>
                Auto logout after 15 minutes inactivity
              </Switch>

              <Switch>
                Restrict admin panel to allowlisted networks
              </Switch>

              <div className="flex gap-2 pt-2">
                <Button variant="danger" className="flex-1">
                  Reset API Tokens
                </Button>
                <Button variant="outline" className="flex-1">
                  Audit Logs
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>

      </section>
    </DashboardLayout>
  );
}