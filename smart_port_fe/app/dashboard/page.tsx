// app/dashboard/page.tsx
// Example usage of DashboardLayout in a Next.js App Router page

import { DashboardLayout } from "@/app/components/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout defaultActiveKey="dashboard" pageTitle="Dashboard">
      {/* ← Add your page content here */}
      <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-default-200 text-default-400">
        <p className="text-sm">Your dashboard content goes here</p>
      </div>
    </DashboardLayout>
  );
}
