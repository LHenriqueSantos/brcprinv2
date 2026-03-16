"use client";
import Sidebar from "./Sidebar";
import React from "react";
import FloatingCart from "./FloatingCart";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Rotas que são ALWAYS public (mesmo logado não exibe Sidebar, tipo HomePage ou Login)
  const isStrictlyPublic = pathname === "/" || pathname === "/contato" || pathname === "/carrinho" || pathname?.startsWith("/checkout") || pathname === "/login" || pathname === "/cliente/login" || pathname === "/cliente/cadastro" || pathname?.startsWith("/portal") || pathname === "/esqueci-senha" || pathname === "/redefinir-senha";

  // Rotas que são publicas QUANDO DESLOGADO, mas DEVEM EXIBIR SIDEBAR se o cliente estiver logado!
  const isHybridPublic = pathname?.startsWith("/catalogo") || pathname?.startsWith("/modelos-parametricos") || pathname?.startsWith("/leiloes") || pathname?.startsWith("/leilao");

  const isLogged = status === "authenticated";

  // Será public se for estritamente public (home, login) OU se for route híbrida mas o usuário NÃO estiver logado
  const isPublic = isStrictlyPublic || (isHybridPublic && !isLogged);

  // Evita Hydration Mismatch entre server sem cookie e cliente com cookie ghost
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <main style={{ flex: 1, padding: "2rem", overflowY: "auto", width: "100%" }}>{children}<FloatingCart /></main>
  }

  if (isPublic) {
    return (
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto", width: "100%" }}>
        {children}
        <FloatingCart />
      </main>
    );
  }

  return (
    <>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto", maxWidth: "calc(100vw - 240px)" }}>
        {children}
        <FloatingCart />
      </main>
    </>
  );
}
