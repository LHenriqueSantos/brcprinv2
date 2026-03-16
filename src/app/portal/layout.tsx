// Portal público: sem sidebar, layout minimalista
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "2rem 1rem" }}>
      {children}
    </div>
  );
}
