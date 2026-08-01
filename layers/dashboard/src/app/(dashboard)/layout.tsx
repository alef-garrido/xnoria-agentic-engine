"use client";

import { TopBar, StatusBar } from "@/components/TenacitOS";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: 'flex' }}>
      <Sidebar />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        
        <main
          style={{
            marginLeft: "var(--layout-sidebar-w)", // Width of sidebar (16rem = 256px)
            marginTop: "var(--layout-topbar-h)", // Height of top bar
            marginBottom: "var(--layout-statusbar-h)", // Height of status bar
            minHeight: "calc(100vh - var(--layout-topbar-h) - var(--layout-statusbar-h))",
            padding: "var(--layout-main-pad-y)",
          }}
        >
          {children}
        </main>

        <StatusBar />
      </div>
    </div>
  );
}
