"""
Serviço de precificação — migrado da lógica do Next.js.
Calcula todos os custos de uma cotação de impressão 3D.
"""
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class QuoteInput:
    print_time_hours: float
    filament_used_g: float
    quantity: int
    energy_kwh_price: float
    labor_hourly_rate: float
    profit_margin_pct: float
    loss_pct: float
    spare_parts_pct: float
    printer_power_watts: float
    printer_purchase_price: float
    printer_lifespan_hours: int
    printer_maintenance_pct: float
    filament_cost_per_kg: float
    setup_time_hours: float = 0.5
    post_process_hours: float = 0.0
    tax_pct: float = 0.0
    extras_total: float = 0.0
    discount_value: float = 0.0
    shipping_cost: float = 0.0
    is_multicolor: bool = False
    multicolor_markup_pct: float = 0.0
    multicolor_waste_g: float = 0.0
    multicolor_hours_added: float = 0.0


@dataclass
class QuoteResult:
    cost_filament: float
    cost_energy: float
    cost_depreciation: float
    cost_maintenance: float
    cost_labor: float
    cost_losses: float
    cost_spare_parts: float
    cost_total_production: float
    profit_value: float
    tax_amount: float
    final_price: float
    final_price_per_unit: float


def calculate_quote(inp: QuoteInput) -> QuoteResult:
    qty = max(inp.quantity, 1)

    # Filamento
    filament_kg = inp.filament_used_g / 1000
    cost_filament = filament_kg * inp.filament_cost_per_kg * qty

    # Multicolor
    if inp.is_multicolor and inp.multicolor_markup_pct > 0:
        waste_cost = (inp.multicolor_waste_g / 1000) * inp.filament_cost_per_kg * qty
        cost_filament += waste_cost
        multicolor_markup = cost_filament * (inp.multicolor_markup_pct / 100)
        cost_filament += multicolor_markup

    # Energia
    total_hours = (inp.print_time_hours + inp.multicolor_hours_added if inp.is_multicolor else inp.print_time_hours) * qty
    energy_kwh = (inp.printer_power_watts / 1000) * total_hours
    cost_energy = energy_kwh * inp.energy_kwh_price

    # Depreciação
    cost_depreciation = (inp.printer_purchase_price / inp.printer_lifespan_hours) * total_hours if inp.printer_lifespan_hours > 0 else 0

    # Manutenção
    cost_maintenance = cost_depreciation * (inp.printer_maintenance_pct / 100)

    # Mão de obra
    total_labor_hours = (inp.setup_time_hours + inp.post_process_hours) * qty
    cost_labor = total_labor_hours * inp.labor_hourly_rate

    # Custo total de produção
    subtotal_prod = cost_filament + cost_energy + cost_depreciation + cost_maintenance + cost_labor

    # Perdas e peças sobressalentes
    cost_losses = subtotal_prod * (inp.loss_pct / 100)
    cost_spare_parts = subtotal_prod * (inp.spare_parts_pct / 100)

    cost_total_production = subtotal_prod + cost_losses + cost_spare_parts + inp.extras_total

    # Lucro
    profit_value = cost_total_production * (inp.profit_margin_pct / 100)

    # Preço antes do imposto
    pre_tax = cost_total_production + profit_value + inp.shipping_cost - inp.discount_value

    # Imposto
    tax_amount = pre_tax * (inp.tax_pct / 100)

    final_price = round(pre_tax + tax_amount, 2)
    final_price_per_unit = round(final_price / qty, 2)

    return QuoteResult(
        cost_filament=round(cost_filament, 2),
        cost_energy=round(cost_energy, 2),
        cost_depreciation=round(cost_depreciation, 2),
        cost_maintenance=round(cost_maintenance, 2),
        cost_labor=round(cost_labor, 2),
        cost_losses=round(cost_losses, 2),
        cost_spare_parts=round(cost_spare_parts, 2),
        cost_total_production=round(cost_total_production, 2),
        profit_value=round(profit_value, 2),
        tax_amount=round(tax_amount, 2),
        final_price=final_price,
        final_price_per_unit=final_price_per_unit,
    )
