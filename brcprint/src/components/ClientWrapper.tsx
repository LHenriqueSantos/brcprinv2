"use client";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/" || pathname === "/login" || pathname === "/cliente/login" || pathname === "/cliente/cadastro" || pathname?.startsWith("/portal");

  if (isPublic) {
    return <main style={{ flex: 1, padding: "2rem", overflowY: "auto", width: "100%" }}>{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto", maxWidth: "calc(100vw - 240px)" }}>
        {children}
      </main>
    </>
  );
}
