"use client";

import { useEffect, useState } from "react";

interface Printer {
  id: number;
  name: string;
  model: string;
  power_watts: number;
  purchase_price: number;
  lifespan_hours: number;
  maintenance_reserve_pct: number;
  maintenance_alert_threshold: number;
  current_hours_printed: number;
  last_maintenance_hours: number;
  type: string;
  active: number;
  api_type: string;
  ip_address: string;
  api_key: string;
  device_serial: string;
}

const empty = () => ({
  name: "", model: "", type: "FDM", power_watts: "", purchase_price: "", lifespan_hours: "2000", maintenance_reserve_pct: "5", maintenance_alert_threshold: "200", current_hours_printed: 0,
  api_type: "none", ip_address: "", api_key: "", device_serial: ""
});

const F = ({ label, fkey, form, setForm, ...props }: any) => (
  <div style={{ marginBottom: "1rem" }}>
    <label className="label">{label}</label>
    <input
      className="input"
      value={form[fkey] || ""}
      onChange={(e) => setForm((prev: any) => ({ ...prev, [fkey]: e.target.value }))}
      {...props}
      required={props.type !== 'password' && fkey !== 'ip_address' && fkey !== 'api_key'}
    />
  </div>
);

export default function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);
  const [form, setForm] = useState<any>(empty());

  const load = () => fetch("/api/printers").then((r) => r.json()).then(setPrinters);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty()); setModal(true); };
  const openEdit = (p: Printer) => { setEditing(p); setForm({ ...p }); setModal(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/printers/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/printers", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setModal(false); load();
  };

  const deactivate = async (id: number) => {
    if (!confirm("Desativar esta impressora?")) return;
    await fetch(`/api/printers/${id}`, { method: "DELETE" });
    load();
  };

  const [maintModal, setMaintModal] = useState<Printer | null>(null);
  const [maintLoading, setMaintLoading] = useState(false);
  const [maintForm, setMaintForm] = useState({
    maintenanceType: "Troca de Bico",
    cost: 0,
    description: "",
    addToExpenses: false,
    consumables: [] as { id: number; quantity: number }[]
  });

  const [availableConsumables, setAvailableConsumables] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/consumables").then(r => r.json()).then(setAvailableConsumables);
  }, []);

  const [historyModal, setHistoryModal] = useState<Printer | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const submitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintModal) return;
    setMaintLoading(true);
    try {
      await fetch(`/api/printers/${maintModal.id}/maintenance`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          maintenanceType: maintForm.maintenanceType,
          cost: Number(maintForm.cost),
          description: maintForm.description,
          addToExpenses: maintForm.addToExpenses,
          consumables: maintForm.consumables
        })
      });
      setMaintModal(null);
      load();
    } catch (err) {
      alert("Erro ao salvar manutenção.");
    } finally {
      setMaintLoading(false);
    }
  };

  const openHistory = async (p: Printer) => {
    setHistoryModal(p);
    setHistoryLogs([]);
    try {
      const res = await fetch(`/api/printers/${p.id}/maintenance`);
      const data = await res.json();
      setHistoryLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Impressoras</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>
            Gerencie as impressoras e seus parâmetros de custo
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Adicionar</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome / Modelo</th>
                <th>Tipo</th>
                <th>Potência (W)</th>
                <th>Preço compra</th>
                <th>Vida útil (h)</th>
                <th>Res. manutenção</th>
                <th>Desgaste Manutenção</th>
                <th>ROI Estimado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {printers.filter(p => p.active).map((p) => {
                const threshold = p.maintenance_alert_threshold || 200;
                const totalHours = p.current_hours_printed || 0;
                const lastHours = p.last_maintenance_hours || 0;
                const cycleHours = Math.max(0, totalHours - lastHours);
                const pct = Math.min(100, (cycleHours / threshold) * 100);
                const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "var(--accent)";

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{p.model}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, background: p.type === 'SLA' ? '#8b5cf622' : '#3b82f622', color: p.type === 'SLA' ? '#8b5cf6' : '#3b82f6' }}>
                        {p.type === 'SLA' ? 'SLA (Resina)' : 'FDM (Filamento)'}
                      </span>
                    </td>
                    <td>{p.power_watts} W</td>
                    <td>{Number(p.purchase_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td>{p.lifespan_hours}h</td>
                    <td>{p.maintenance_reserve_pct}%</td>
                    <td style={{ minWidth: "150px" }}>
                      <div style={{ fontSize: "0.75rem", marginBottom: "0.25rem", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, color }}>Uso: {cycleHours.toFixed(1)}h</span>
                        <span style={{ color: "var(--muted)" }}>Total: {totalHours.toFixed(1)}h</span>
                      </div>
                      <div style={{ height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color }} />
                      </div>
                      <button onClick={() => { setMaintModal(p); setMaintForm({ maintenanceType: "Troca de Bico", cost: 0, description: "", addToExpenses: false, consumables: [] }) }} className="btn btn-ghost" style={{ fontSize: "0.7rem", marginTop: "0.4rem", padding: "0.2rem", color: pct >= 80 ? "#ef4444" : "var(--muted)", width: "100%", border: "1px dashed var(--border)" }}>
                        ⚙️ Registrar Manutenção
                      </button>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>
                        {p.purchase_price > 0 ? (
                          <>
                            <div title="Percentual do valor da máquina já retornado em faturamento">
                              {((p.current_hours_printed * 10) / p.purchase_price * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 400 }}>
                              Recup. Capital
                            </div>
                          </>
                        ) : "--"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.9rem" }} onClick={() => openHistory(p)} title="Histórico de Manutenção">📖</button>
                        <button className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.9rem" }} onClick={() => openEdit(p)} title="Editar">✏️</button>
                        <button className="btn btn-danger" style={{ padding: "0.3rem 0.75rem", fontSize: "0.9rem" }} onClick={() => deactivate(p.id)} title="Excluir">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!printers.filter(p => p.active).length && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>Nenhuma impressora cadastrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editing ? "Editar Impressora" : "Nova Impressora"}</h2>
            <form onSubmit={save}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <F label="Nome" fkey="name" form={form} setForm={setForm} />
                <F label="Modelo" fkey="model" form={form} setForm={setForm} />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="label">Tecnologia (Tipo)</label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="FDM">FDM (Filamento / Extrusão)</option>
                  <option value="SLA">SLA / LCD (Resina / Cura UV)</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <F label="Potência (W)" fkey="power_watts" type="number" step="0.01" form={form} setForm={setForm} />
                <F label="Preço de compra (R$)" fkey="purchase_price" type="number" step="0.01" form={form} setForm={setForm} />
                <F label="Vida útil (horas)" fkey="lifespan_hours" type="number" form={form} setForm={setForm} />
                <F label="Reserva manutenção (%)" fkey="maintenance_reserve_pct" type="number" step="0.01" form={form} setForm={setForm} />
              </div>
              <F label="Alerta de Manutenção Preventiva (horas)" fkey="maintenance_alert_threshold" type="number" form={form} setForm={setForm} />

              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--surface2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", fontWeight: 700 }}>Integração de Impressão Direta (Opcional)</h3>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="label">Tipo de Conexão API</label>
                  <select className="input" value={form.api_type || 'none'} onChange={e => setForm({ ...form, api_type: e.target.value })}>
                    <option value="none">Nenhuma (Manual)</option>
                    <option value="octoprint">OctoPrint</option>
                    <option value="moonraker">Klipper (Moonraker / Mainsail / Fluidd)</option>
                    <option value="bambu">🐼 Bambu Lab (Local MQTT)</option>
                  </select>
                </div>
                {form.api_type && form.api_type !== 'none' && form.api_type !== 'bambu' && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <F label="Endereço IP (ex: 192.168.1.100 ou http://klipper.local)" fkey="ip_address" placeholder="http://..." form={form} setForm={setForm} />
                    <F label="Chave de API (Token)" fkey="api_key" placeholder="Apenas se necessário" form={form} setForm={setForm} />
                  </div>
                )}
                {form.api_type === 'bambu' && (
                  <div>
                    <div style={{ background: "#1a2a1a", border: "1px solid #22c55e44", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#86efac" }}>
                      <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>🐼 Como configurar a Bambu Lab</div>
                      <div>1. Na impressora: <strong>Settings → WLAN → Ativar LAN Mode</strong></div>
                      <div>2. <strong>IP:</strong> Mostrado na tela em Settings → WLAN</div>
                      <div>3. <strong>Access Code:</strong> Código de 8 dígitos em Settings → WLAN</div>
                      <div>4. <strong>Serial Number:</strong> Em Settings → Device Information</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <F label="IP da Bambu na rede local (ex: 192.168.1.120)" fkey="ip_address" placeholder="192.168.x.x" form={form} setForm={setForm} />
                      <F label="Access Code (código na tela da impressora)" fkey="api_key" placeholder="Ex: 12345678" form={form} setForm={setForm} />
                    </div>
                    <F label="Serial Number (Settings → Device Information)" fkey="device_serial" placeholder="Ex: 01P00A000000000" form={form} setForm={setForm} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {maintModal && (
        <div className="modal-overlay" onClick={() => setMaintModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h2 className="modal-title">Registrar Manutenção</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
              A gravação deste log irá zerar o alerta de horas da impressora <strong style={{ color: "var(--text)" }}>{maintModal.name}</strong>.
            </p>
            <form onSubmit={submitMaintenance} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Tipo de Manutenção</label>
                <select className="input" value={maintForm.maintenanceType} onChange={e => setMaintForm({ ...maintForm, maintenanceType: e.target.value })}>
                  <option value="Troca de Bico">Troca de Bico</option>
                  <option value="Lubrificação">Lubrificação Geral</option>
                  <option value="Ajuste de Correias">Ajuste de Correias</option>
                  <option value="Troca de Tubo PTFE">Troca de Tubo PTFE / Bowden</option>
                  <option value="Limpeza de FEP / VAT">Limpeza de FEP / VAT (Resina)</option>
                  <option value="Troca de FEP">Troca de FEP (Resina)</option>
                  <option value="Outro">Outro (Descrever nas observações)</option>
                </select>
              </div>

              <div>
                <label className="label">Custo da Peça (R$)</label>
                <input className="input" type="number" step="0.01" min="0" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: Number(e.target.value) })} />
              </div>

              {Number(maintForm.cost) > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface2)", padding: "1rem", borderRadius: "8px", border: "1px dashed var(--accent)", cursor: "pointer" }}>
                  <input type="checkbox" checked={maintForm.addToExpenses} onChange={e => setMaintForm({ ...maintForm, addToExpenses: e.target.checked })} style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--accent)" }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Lançar automaticamente no Financeiro</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Criar despesa paga de <strong>R$ {Number(maintForm.cost).toFixed(2)}</strong> na categoria Manutenção.</div>
                  </div>
                </label>
              )}

              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} placeholder="Detalhes opcionais..." value={maintForm.description} onChange={e => setMaintForm({ ...maintForm, description: e.target.value })}></textarea>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <label className="label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  📦 Consumíveis Utilizados
                  <button type="button" className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }} onClick={() => setMaintForm({ ...maintForm, consumables: [...maintForm.consumables, { id: 0, quantity: 1 }] })}>+ Adicionar</button>
                </label>
                {maintForm.consumables.map((c, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <select className="input" style={{ flex: 2 }} value={c.id} onChange={e => {
                      const newCons = [...maintForm.consumables];
                      newCons[idx].id = Number(e.target.value);
                      setMaintForm({ ...maintForm, consumables: newCons });
                    }}>
                      <option value="0">Selecione item...</option>
                      {availableConsumables.map(ac => (
                        <option key={ac.id} value={ac.id}>{ac.name} ({ac.stock_current} {ac.unit_type})</option>
                      ))}
                    </select>
                    <input className="input" style={{ flex: 1 }} type="number" step="0.01" value={c.quantity} onChange={e => {
                      const newCons = [...maintForm.consumables];
                      newCons[idx].quantity = Number(e.target.value);
                      setMaintForm({ ...maintForm, consumables: newCons });
                    }} />
                    <button type="button" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => {
                      const newCons = maintForm.consumables.filter((_, i) => i !== idx);
                      setMaintForm({ ...maintForm, consumables: newCons });
                    }}>✕</button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={maintLoading}>{maintLoading ? 'Salvando...' : 'Zerar Alerta e Salvar Log'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setMaintModal(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="modal-overlay" onClick={() => setHistoryModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <h2 className="modal-title" style={{ marginBottom: "0.5rem" }}>Histórico de Manutenção</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
              Impressora: <strong style={{ color: "var(--text)" }}>{historyModal.name} ({historyModal.model})</strong>
            </p>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
              {historyLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", background: "var(--surface2)", borderRadius: "8px" }}>Nenhum histórico registrado ainda.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {historyLogs.map(log => (
                    <div key={log.id} style={{ background: "var(--surface2)", padding: "1rem", borderRadius: "8px", borderLeft: "4px solid var(--accent)", position: "relative" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", position: "absolute", top: "1rem", right: "1rem" }}>
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem", color: "var(--text)" }}>{log.maintenance_type}</div>
                      {Number(log.cost) > 0 && (
                        <div style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 700, marginBottom: "0.5rem" }}>Custo: R$ {Number(log.cost).toFixed(2)}</div>
                      )}
                      {log.description && (
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)", whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{log.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button className="btn btn-ghost" onClick={() => setHistoryModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
