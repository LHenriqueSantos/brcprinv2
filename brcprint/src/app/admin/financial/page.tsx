"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar } from "lucide-react";

export default function FinancialPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const fetchDRE = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/financial/dre?month=${month}&year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDRE();
  }, [month, year]);

  if (loading && !data) {
    return <div className="p-8 text-center">Carregando inteligência financeira...</div>;
  }

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Painel Financeiro & DRE
          </h1>
          <p className="text-[var(--muted)] text-sm">Demonstrativo de Resultados do Exercício</p>
        </div>

        <div className="flex gap-2">
          <select
            className="input text-sm p-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="01">Janeiro</option>
            <option value="02">Fevereiro</option>
            <option value="03">Março</option>
            <option value="04">Abril</option>
            <option value="05">Maio</option>
            <option value="06">Junho</option>
            <option value="07">Julho</option>
            <option value="08">Agosto</option>
            <option value="09">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
          <select
            className="input text-sm p-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-wider">Receita Bruta</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">{formatCurrency(s.grossRevenue)}</p>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-wider">Custos Produtivos (CMV)</span>
            <TrendingDown size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">{formatCurrency(s.cogs)}</p>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[var(--muted)] text-xs font-bold uppercase tracking-wider">Despesas Operacionais</span>
            <TrendingDown size={16} className="text-red-400" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">{formatCurrency(s.fixedExpenses + s.variableExpenses)}</p>
        </div>

        <div className={`p-6 rounded-xl shadow-md border ${s.netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`${s.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} text-xs font-bold uppercase tracking-wider`}>Lucro Líquido Real</span>
            <DollarSign size={16} className={s.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <p className={`text-2xl font-black ${s.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(s.netProfit)}</p>
          <p className="text-[10px] mt-1 text-[var(--muted)] font-medium">Margem Líquida: {s.grossRevenue > 0 ? ((s.netProfit / s.grossRevenue) * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DRE Table Card */}
        <div className="card p-0 overflow-hidden">
          <div className="bg-[var(--surface2)] p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
              <PieChart size={18} className="text-indigo-400" /> Tabela DRE
            </h3>
            <span className="text-[10px] bg-[var(--surface)] text-[var(--muted)] px-2 py-0.5 rounded-full font-bold">MÊS DE COMPETÊNCIA</span>
          </div>
          <div className="p-0">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-[var(--border)]">
                <tr className="bg-emerald-500/5">
                  <td className="p-4 font-bold text-[var(--text)]">(+) RECEITA BRUTA DE VENDAS</td>
                  <td className="p-4 text-right font-black text-emerald-400">{formatCurrency(s.grossRevenue)}</td>
                </tr>
                <tr>
                  <td className="p-4 text-[var(--muted)]">(-) Impostos e Taxas (Simples Nacional/Outros)</td>
                  <td className="p-4 text-right text-red-400 font-bold">{formatCurrency(s.taxes)}</td>
                </tr>
                <tr className="bg-[var(--surface2)] font-bold">
                  <td className="p-4 text-[var(--text)]">(=) RECEITA LÍQUIDA</td>
                  <td className="p-4 text-right font-bold text-[var(--text)]">{formatCurrency(s.netRevenue)}</td>
                </tr>
                <tr>
                  <td className="p-4 text-[var(--muted)]">(-) Custos de Produção (Filamento, Energia, Mão de obra direta)</td>
                  <td className="p-4 text-right text-red-400 font-bold">{formatCurrency(s.cogs)}</td>
                </tr>
                <tr className="bg-indigo-500/10 font-bold">
                  <td className="p-4 text-indigo-300">(=) LUCRO BRUTO</td>
                  <td className="p-4 text-right font-bold text-indigo-400">{formatCurrency(s.grossProfit)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-[var(--text)]">(-) DESPESAS OPERACIONAIS</td>
                  <td className="p-4 text-right font-bold text-red-400">{formatCurrency(s.fixedExpenses + s.variableExpenses)}</td>
                </tr>
                <tr className="text-xs italic bg-red-500/5">
                  <td className="p-3 pl-8 text-[var(--muted)]">Despesas Fixas (Aluguel, Pro-labore, Internet)</td>
                  <td className="p-3 text-right text-[var(--text)] font-medium">{formatCurrency(s.fixedExpenses)}</td>
                </tr>
                <tr className="text-xs italic bg-red-500/5">
                  <td className="p-3 pl-8 text-[var(--muted)]">Despesas Variáveis (Marketing, Fretes, Manutenções)</td>
                  <td className="p-3 text-right text-[var(--text)] font-medium">{formatCurrency(s.variableExpenses)}</td>
                </tr>
                <tr className={`${s.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
                  <td className="p-5 font-black text-lg">(=) LUCRO LÍQUIDO FINAL</td>
                  <td className="p-5 text-right font-black text-2xl">{formatCurrency(s.netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses and Info */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-400" /> Detalhamento por Categoria
            </h3>
            {data?.details?.length > 0 ? (
              <div className="space-y-3">
                {data.details.map((cat: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
                    <div>
                      <span className="font-bold text-[var(--text)]">{cat.category}</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${cat.type === 'fixed' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {cat.type === 'fixed' ? 'FIXA' : 'VARIÁVEL'}
                      </span>
                    </div>
                    <span className="font-bold text-[var(--text)]">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--muted)] italic">
                Nenhuma despesa paga neste período.
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-2xl shadow-xl text-white">
            <h3 className="font-bold text-xl mb-2 text-white">Saúde Financeira</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-4">
              Este dashboard utiliza o regime de **competência** para vendas e **caixa** para despesas.
              Lembre-se de marcar suas contas como "Pagas" na aba de Despesas para que elas apareçam aqui com a data de pagamento correta.
            </p>
            <div className="flex gap-4">
              <div className="bg-white/10 p-3 rounded-xl flex-1 text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Break-even</p>
                <p className="text-xl font-black text-white">{formatCurrency(s.fixedExpenses + s.variableExpenses + s.cogs)}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl flex-1 text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Ponto de Equilíbrio</p>
                <p className="text-xl font-black text-white">{s.grossRevenue > 0 ? ((s.fixedExpenses + s.variableExpenses + s.cogs) / s.grossRevenue * 100).toFixed(0) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
