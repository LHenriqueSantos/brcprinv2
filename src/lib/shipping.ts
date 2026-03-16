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

  if (input.token && input.token.length > 10 && input.provider === 'melhorenvio') {
    try {
      const isProduction = !input.token.startsWith('TEST-'); // Simplified check or could use env
      const apiUrl = isProduction
        ? 'https://www.melhorenvio.com.br/api/v2/me'
        : 'https://sandbox.melhorenvio.com.br/api/v2/me';

      const response = await fetch(`${apiUrl}/shipment/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${input.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BRCPrint/1.0'
        },
        body: JSON.stringify({
          from: { postal_code: input.fromZip.replace(/\D/g, "") },
          to: { postal_code: input.toZip.replace(/\D/g, "") },
          package: {
            weight: input.weight_g / 1000,
            width: input.dimensions.width,
            height: input.dimensions.height,
            length: input.dimensions.length
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out errors and map to our format
        return data.filter((s: any) => !s.error).map((s: any) => ({
          id: String(s.id),
          name: s.name,
          price: parseFloat(s.price),
          delivery_range: `${s.delivery_range.min} a ${s.delivery_range.max} dias úteis`,
          company: s.company.name,
          error: s.error
        }));
      } else {
        console.error("Melhor Envio calculation failed:", await response.text());
      }
    } catch (e) {
      console.error("Error in real shipping calculation:", e);
    }
  }

  // FALLBACK / MOCK CALCULATION
  // Simulate PAC and SEDEX
  const weightKg = input.weight_g / 1000;
  const basePrice = 15 + (weightKg * 5); // Simple linear cost

  return [
    {
      id: "1", // PAC
      name: "PAC (Correios)",
      price: parseFloat(basePrice.toFixed(2)),
      delivery_range: "5 a 10 dias úteis",
      company: "Correios"
    },
    {
      id: "2", // SEDEX
      name: "SEDEX (Correios)",
      price: parseFloat((basePrice * 1.8).toFixed(2)),
      delivery_range: "1 a 3 dias úteis",
      company: "Correios"
    }
  ];
}
