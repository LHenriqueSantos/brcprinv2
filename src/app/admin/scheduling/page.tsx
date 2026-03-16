"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import BacklogSidebar from "@/components/scheduling/BacklogSidebar";
import PrinterLane from "@/components/scheduling/PrinterLane";

type Quote = {
  id: number;
  title: string;
  status: string;
  client_name: string;
  print_time_hours: number;
  scheduled_start: string | null;
  scheduled_end: string | null;
  printer_id: number | null;
};

type Printer = {
  id: number;
  name: string;
  type: string;
};

export default function SchedulingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  // Drag State
  const [draggedQuoteId, setDraggedQuoteId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchSchedule();
  }, [status, router]);

  async function fetchSchedule() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scheduling");
      if (res.ok) {
        const data = await res.json();
        setPrinters(data.printers);

        // Formatar datas para o fuso local
        const formattedQuotes = data.quotes.map((q: any) => ({
          ...q,
          scheduled_start: q.scheduled_start ? new Date(q.scheduled_start).toISOString() : null,
          scheduled_end: q.scheduled_end ? new Date(q.scheduled_end).toISOString() : null,
        }));

        setQuotes(formattedQuotes);

        // Fetch config também
        const configRes = await fetch("/api/config");
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedQuoteId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropToPrinter = async (printerId: number) => {
    if (!draggedQuoteId) return;

    const quoteToMove = quotes.find(q => q.id === draggedQuoteId);
    if (!quoteToMove) return;

    // Calcular data de início
    // Se a máquina já tem peças escaladas, começa logo após a última peça.
    // Se não, começa agora.
    const scheduledItemsOnPrinter = quotes
      .filter(q => q.printer_id === printerId && q.id !== draggedQuoteId)
      .sort((a, b) => new Date(a.scheduled_end || 0).getTime() - new Date(b.scheduled_end || 0).getTime());

    let startDate = new Date(); // Agora

    if (scheduledItemsOnPrinter.length > 0) {
      const lastItem = scheduledItemsOnPrinter[scheduledItemsOnPrinter.length - 1];
      if (lastItem.scheduled_end) {
        const lastEndDate = new Date(lastItem.scheduled_end);
        if (lastEndDate > startDate) {
          startDate = new Date(lastEndDate);
        }
      }
    }

    // Calcular data de término (Soma das horas)
    const printTimeHours = quoteToMove.print_time_hours || 0;
    const endDate = new Date(startDate.getTime() + printTimeHours * 60 * 60 * 1000);

    // Optimistic UI Update
    setQuotes(quotes.map(q => {
      if (q.id === draggedQuoteId) {
        return {
          ...q,
          printer_id: printerId,
          scheduled_start: startDate.toISOString(),
          scheduled_end: endDate.toISOString(),
          status: 'in_production'
        };
      }
      return q;
    }));

    setDraggedQuoteId(null);

    // Persist to API
    await fetch(`/api/quotes/${draggedQuoteId}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        printer_id: printerId,
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString()
      })
    });
  };

  const handleDropToBacklog = async () => {
    if (!draggedQuoteId) return;

    setQuotes(quotes.map(q => {
      if (q.id === draggedQuoteId) {
        return { ...q, printer_id: null, scheduled_start: null, scheduled_end: null, status: 'approved' };
      }
      return q;
    }));

    setDraggedQuoteId(null);

    await fetch(`/api/quotes/${draggedQuoteId}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        printer_id: null,
        scheduled_start: null,
        scheduled_end: null
      })
    });
  };

  if (loading) return <div style={{ padding: "2rem" }}>Carregando motor de escalonamento...</div>;

  const backlogQuotes = quotes.filter(q => q.printer_id === null);

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 4rem)", background: "var(--background)", overflow: "hidden", margin: "-2rem", padding: "0" }}>

      {/* Header */}
      <div style={{ padding: "2rem 2rem 1rem", borderBottom: "1px solid var(--border)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, background: "linear-gradient(45deg, var(--accent), #9b8bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Motor de Fila & Gantt
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Arraste pedidos aprovados da fila de espera para programar o uso de cada máquina.
        </p>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        <BacklogSidebar
          quotes={backlogQuotes}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDropToBacklog}
          formatShortDate={formatShortDate}
        />

        {/* Timeline Board */}
        <div style={{ flex: 1, padding: "1.5rem", overflowX: "auto", overflowY: "auto", background: "var(--background)" }}>
          <div style={{ minWidth: "800px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {printers.map(printer => (
              <PrinterLane
                key={printer.id}
                printer={printer}
                quotes={quotes}
                config={config}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDropToPrinter}
                formatShortDate={formatShortDate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
