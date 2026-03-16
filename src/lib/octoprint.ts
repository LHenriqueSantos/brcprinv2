import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { uploadAndPrintBambu } from './bambu';

interface PrintStatus {
  success: boolean;
  message: string;
}

/**
 * Roteador unificado de impressão.
 * Decide automaticamente o protocolo correto (OctoPrint ou Bambu Lab) com base
 * no `api_type` da impressora cadastrada no banco de dados.
 */
export async function dispatchPrint(printer: {
  api_type: string;
  ip_address: string;
  api_key: string;
  device_serial?: string;
}, fullGcodePath: string): Promise<PrintStatus> {
  switch (printer.api_type) {
    case 'octoprint':
    case 'moonraker':
      return uploadAndPrintOctoPrint(fullGcodePath, printer.ip_address, printer.api_key);
    case 'bambu':
      if (!printer.device_serial) {
        return { success: false, message: 'Serial da impressora Bambu não configurado. Configure em Admin → Impressoras.' };
      }
      return uploadAndPrintBambu(fullGcodePath, printer.ip_address, printer.api_key, printer.device_serial);
    default:
      return { success: false, message: `Tipo de API desconhecido: ${printer.api_type}` };
  }
}

/**
 * Helper para envio de arquivos G-code para impressoras rodando OctoPrint ou Moonraker.
 */
export async function uploadAndPrintOctoPrint(
  fullGcodePath: string,
  printerIp: string,
  apiKey: string
): Promise<PrintStatus> {
  try {
    if (!fs.existsSync(fullGcodePath)) {
      return { success: false, message: `O arquivo G-code não foi encontrado no servidor: ${fullGcodePath}` };
    }

    const filename = path.basename(fullGcodePath);
    const form = new FormData();
    form.append('file', fs.createReadStream(fullGcodePath));
    form.append('select', 'true');
    form.append('print', 'true'); // Automatically start printing after upload

    const url = `http://${printerIp}/api/files/local`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        ...form.getHeaders()
      },
      body: form as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OCTOPRINT] API Error: ${response.status} - ${errorText}`);
      return { success: false, message: `Erro ao enviar para API da impressora: ${response.status}` };
    }

    const data = await response.json();
    console.log(`[OCTOPRINT] Sucesso ao iniciar impressão: ${filename}`, data);
    return { success: true, message: `Impressão iniciada com sucesso em ${printerIp}` };

  } catch (error: any) {
    console.error(`[OCTOPRINT] Falha de comunicação de rede:`, error);
    return { success: false, message: `Falha de rede ou configuração da impressora. Erro: ${error.message}` };
  }
}
