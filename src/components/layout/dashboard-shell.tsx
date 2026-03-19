"use client";

import { useState, createContext, useContext } from "react";
import { Sidebar } from "./sidebar";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <main
          className="flex-1 transition-all duration-300"
          style={{ marginLeft: collapsed ? 72 : 260 }}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}