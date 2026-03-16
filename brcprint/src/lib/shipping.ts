/**
 * Shipping Utility for BRCPrint
 * Supports Melhor Envio and Frenet (mock/ready for real API)
 */

interface ShippingCalcInput {
  fromZip: string;
  toZip: string;
  weight_g: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  provider: 'melhorenvio' | 'frenet' | 'none';
  token?: string;
}

export async function calculateShipping(input: ShippingCalcInput) {
  if (input.provider === 'none' || !input.toZip) {
    return [];
  }

  // Basic validation
  const cleanTo = input.toZip.replace(/\D/g, "");
  const cleanFrom = input.fromZip.replace(/\D/g, "");

  if (cleanTo.length < 8) return [];

  // If we have a token, we could call the real API.
  // For now, we implement a consistent logic/mock that simulates the return.

  if (input.token && input.token.length > 10) {
    // REAL INTEGRATION POINT
    // try {
    //   if (input.provider === 'melhorenvio') { ... fetch ... }
    //   if (input.provider === 'frenet') { ... fetch ... }
    // } catch (e) { console.error(e); }
  }

  // FALLBACK / MOCK CALCULATION
  // Simulate PAC and SEDEX
  const weightKg = input.weight_g / 1000;
  const basePrice = 15 + (weightKg * 5); // Simple linear cost

  return [
    {
      id: "pac",
      name: "PAC (Correios)",
      price: parseFloat(basePrice.toFixed(2)),
      delivery_range: "5 a 10 dias úteis",
      company: "Correios"
    },
    {
      id: "sedex",
      name: "SEDEX (Correios)",
      price: parseFloat((basePrice * 1.8).toFixed(2)),
      delivery_range: "1 a 3 dias úteis",
      company: "Correios"
    }
  ];
}
