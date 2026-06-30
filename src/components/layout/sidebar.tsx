"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Truck,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSidebar } from "./dashboard-shell";
import androidChrome72 from "../../../public/assets/images/favicon/android-chrome-72-72.png";
import logoPlenobras from "../../../public/assets/images/logo-loja-plenobras-colored.svg";

const navItems = [
  { href: "/drivers", label: "Motoristas", icon: User },
  { href: "/vehicles", label: "Veículos", icon: Truck },
  { href: "/cargo", label: "Cargas", icon: Package },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();

  return <aside
    className={`fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300 ${
      collapsed ? "w-[72px]" : "w-[260px]"
    }`}
    style={{
      background: "linear-gradient(180deg, #003062 0%, #001a38 100%)",
    }}
  >
    <div
      className={`flex items-center border-b border-white/10 ${
        collapsed ? "justify-center px-2 py-5" : "px-6 py-5"
      }`}
    >
      {collapsed ? <Image
        src={androidChrome72}
        alt="Plenobras"
        width={36}
        height={36}
      /> : <Image
        src={logoPlenobras}
        alt="Plenobras"
        width={180}
        height={44}
        className="brightness-0 invert"
      />}
    </div>

    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return <Link
          key={item.href}
          href={item.href}
          title={collapsed ? item.label : undefined}
          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isActive
              ? "bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:h-6 before:-translate-y-1/2 before:w-[3px] before:rounded-r before:bg-[#ff4700]"
              : "text-white/60 hover:bg-white/5 hover:text-white/90"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      })}
    </nav>

    <button
      onClick={() => setCollapsed(!collapsed)}
      className="mx-3 mb-2 flex items-center justify-center rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
    >
      {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
    </button>

    <div className="border-t border-white/10 p-3">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/90 ${
          collapsed ? "justify-center" : ""
        }`}
        title={collapsed ? "Sair" : undefined}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {!collapsed && <span>Sair</span>}
      </button>
    </div>
  </aside>
}