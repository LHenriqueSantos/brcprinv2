export function calculateCosts(data: {
  print_time_hours: number;
  filament_used_g: number;
  setup_time_hours: number;
  post_process_hours: number;
  quantity: number;
  energy_kwh_price: number;
  energy_flag?: 'green' | 'yellow' | 'red1' | 'red2';
  energy_peak_price?: number;
  energy_off_peak_price?: number;
  energy_peak_start?: string; // "HH:MM:SS"
  energy_peak_end?: string;
  scheduled_start?: string;   // ISO String
  labor_hourly_rate: number;
  profit_margin_pct: number;
  loss_pct: number;
  spare_parts_pct: number;
  power_watts: number;
  purchase_price: number;
  lifespan_hours: number;
  maintenance_reserve_pct: number;
  cost_per_kg: number;
  packaging_cost?: number;
  consumables_cost?: number; // Legacy or ad-hoc
  bom_cost?: number; // New: Sum of Bill of Materials items
}) {
  const r = 2; // casas decimais

  // 1. Custo do Filamento (inclui % de perdas)
  const cost_filament = parseFloat(
    ((data.filament_used_g / 1000) * data.cost_per_kg * (1 + data.loss_pct / 100)).toFixed(r)
  );

  // 2. Custo de Energia Elétrica
  // 2.1 Bandeira Tarifária (Adicional a cada 100 kWh -> 1 kWh = R$ flag / 100)
  // Verde: 0, Amarela: 1.88, Vermelha 1: 4.46, Vermelha 2: 7.88
  let flagSurcharge = 0;
  if (data.energy_flag === 'yellow') flagSurcharge = 1.88 / 100;
  else if (data.energy_flag === 'red1') flagSurcharge = 4.46 / 100;
  else if (data.energy_flag === 'red2') flagSurcharge = 7.88 / 100;

  // 2.2 Tarifa Branca (Ponta vs Fora de Ponta)
  let baseEnergyPrice = data.energy_kwh_price;

  if (data.scheduled_start && data.energy_peak_price && data.energy_off_peak_price && data.energy_peak_start && data.energy_peak_end) {
    // Calcular peso por hora
    const start = new Date(data.scheduled_start);
    const durationHrs = data.print_time_hours;
    let totalEnergyCost = 0;

    // Simulação simplificada hora a hora para determinar custo
    for (let h = 0; h < durationHrs; h++) {
      const currentHourTime = new Date(start.getTime() + h * 3600000);
      const timeStr = currentHourTime.toTimeString().split(' ')[0]; // HH:MM:SS

      let isPeak = false;
      if (data.energy_peak_start < data.energy_peak_end) {
        isPeak = timeStr >= data.energy_peak_start && timeStr < data.energy_peak_end;
      } else {
        // Caso vire o dia (ex: 22:00 as 02:00)
        isPeak = timeStr >= data.energy_peak_start || timeStr < data.energy_peak_end;
      }

      const price = isPeak ? data.energy_peak_price : data.energy_off_peak_price;
      totalEnergyCost += (data.power_watts / 1000) * 1 * (price + flagSurcharge);
    }

    // Ajuste para fração da última hora
    const fraction = durationHrs % 1;
    if (fraction > 0) {
      const lastHourTime = new Date(start.getTime() + Math.floor(durationHrs) * 3600000);
      const timeStr = lastHourTime.toTimeString().split(' ')[0];
      const isPeak = (data.energy_peak_start < data.energy_peak_end)
        ? (timeStr >= data.energy_peak_start && timeStr < data.energy_peak_end)
        : (timeStr >= data.energy_peak_start || timeStr < data.energy_peak_end);

      const price = isPeak ? data.energy_peak_price : data.energy_off_peak_price;
      totalEnergyCost += (data.power_watts / 1000) * fraction * (price + flagSurcharge);
    }

    // Se estiver agendado, usamos o custo simulado
    var cost_energy = parseFloat(totalEnergyCost.toFixed(r));
  } else {
    // Estimativa genérica ou se não houver agendamento
    // Se energy_off_peak_price existe, usamos ele como base + flag
    const effectivePrice = (data.energy_off_peak_price || data.energy_kwh_price) + flagSurcharge;
    var cost_energy = parseFloat(
      ((data.power_watts / 1000) * data.print_time_hours * effectivePrice).toFixed(r)
    );
  }

  // 3. Depreciação da Impressora
  const cost_depreciation = parseFloat(
    ((data.purchase_price / data.lifespan_hours) * data.print_time_hours).toFixed(r)
  );

  // 4. Reserva de Manutenção (% sobre depreciação)
  const cost_maintenance = parseFloat(
    (cost_depreciation * (data.maintenance_reserve_pct / 100)).toFixed(r)
  );

  // 5. Custo de Mão de Obra (setup + pós-processamento; impressão é autônoma)
  const cost_labor = parseFloat(
    ((data.setup_time_hours + data.post_process_hours) * data.labor_hourly_rate).toFixed(r)
  );

  // 6. Subtotal antes das reservas percentuais (inclui embalagem e insumos extras se houver)
  const subtotal = cost_filament + cost_energy + cost_depreciation + cost_maintenance + cost_labor + Number(data.packaging_cost || 0) + Number(data.consumables_cost || 0) + Number(data.bom_cost || 0);

  // 7. Reserva para Peças de Reposição (% sobre subtotal)
  const cost_spare_parts = parseFloat(((subtotal * data.spare_parts_pct) / 100).toFixed(r));

  // 8. Value já incluímos perda no filamento; cost_losses é para registro visual
  const cost_losses = parseFloat(
    ((data.filament_used_g / 1000) * data.cost_per_kg * (data.loss_pct / 100)).toFixed(r)
  );

  // 9. Custo Total de Produção
  const cost_total_production = parseFloat((subtotal + cost_spare_parts).toFixed(r));

  // 10. Margem de Lucro
  const profit_value = parseFloat(((cost_total_production * data.profit_margin_pct) / 100).toFixed(r));

  // 11. Preço Final
  const final_price = parseFloat((cost_total_production + profit_value).toFixed(r));
  const final_price_per_unit = parseFloat((final_price / data.quantity).toFixed(r));

  return {
    cost_filament,
    cost_energy,
    cost_depreciation,
    cost_maintenance,
    cost_labor,
    cost_losses,
    cost_spare_parts,
    cost_total_production,
    profit_value,
    final_price,
    final_price_per_unit,
    cost_consumables: Number(data.consumables_cost || 0),
  };
}
