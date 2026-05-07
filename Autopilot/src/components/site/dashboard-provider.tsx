"use client";

import { useEffect } from "react";
import { DashboardSnapshot, dashboardStore } from "@/lib/dashboard-store";

export function DashboardProvider({
  initialData,
  children,
}: {
  initialData: DashboardSnapshot;
  children: React.ReactNode;
}) {
  useEffect(() => {
    dashboardStore.set(initialData);
  }, [initialData]);

  return <>{children}</>;
}
