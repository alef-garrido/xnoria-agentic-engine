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
            marginLeft: "256px", // Width of sidebar (16rem = 256px)
            marginTop: "48px", // Height of top bar
            marginBottom: "32px", // Height of status bar
            minHeight: "calc(100vh - 48px - 32px)",
            padding: "24px",
          }}
        >
          {children}
        </main>

        <StatusBar />
      </div>
    </div>
  );
}
