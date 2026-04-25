import { DashboardLayout } from "@/app/components/DashboardLayout";
import { CustomCells } from "../components/table";

export default function DashboardPage() {
  return (
    <DashboardLayout defaultActiveKey="vessels" pageTitle="Vessels">
      {/* ← Add your page content here */}
      <CustomCells />
    </DashboardLayout>
  );
}
