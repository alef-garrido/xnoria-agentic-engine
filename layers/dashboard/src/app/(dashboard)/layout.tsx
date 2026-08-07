"use client";

import { TopBar, StatusBar } from "@/components/TenacitOS";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/ToastProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <TopBar />

          <main className="ml-[var(--layout-sidebar-w)] mt-[var(--layout-topbar-h)] mb-[var(--layout-statusbar-h)] min-h-[calc(100vh_-_var(--layout-topbar-h)_-_var(--layout-statusbar-h))] p-[var(--layout-main-pad-y)]">
            {children}
          </main>

          <StatusBar />
        </div>
      </div>
    </ToastProvider>
  );
}
