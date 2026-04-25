import { DashboardLayout } from "@/app/components/DashboardLayout";
import { CustomCells } from "../components/table";

export default function DashboardPage() {
  return (
    <DashboardLayout defaultActiveKey="users" pageTitle="Users">
      {/* ← Add your page content here */}
      <CustomCells />
    </DashboardLayout>
  );
}

