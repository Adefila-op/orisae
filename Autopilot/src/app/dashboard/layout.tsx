import { DashboardProvider } from "@/components/site/dashboard-provider";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { getCreatorIdentityFromRequest, getDashboardSnapshot, getDemoDashboardSnapshot } from "@/lib/dashboard-data";
import { DashboardSnapshot } from "@/lib/dashboard-store";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const fallbackData: DashboardSnapshot = getDemoDashboardSnapshot();

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialData = fallbackData;

  try {
    const requestHeaders = headers();
    initialData = await getDashboardSnapshot(
      getCreatorIdentityFromRequest({
        authorization: requestHeaders.get("authorization"),
        creatorIdHeader: requestHeaders.get("x-creator-id"),
        walletHeader: requestHeaders.get("x-wallet-address"),
      }),
    );
  } catch {
    initialData = fallbackData;
  }

  return (
    <DashboardProvider initialData={initialData}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
