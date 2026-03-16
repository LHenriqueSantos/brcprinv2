import * as mqtt from 'mqtt';
import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import * as tls from 'tls';

interface PrintStatus {
  success: boolean;
  message: string;
}

/**
 * Faz upload do arquivo G-code para a impressora Bambu Lab via FTP TLS,
 * e em seguida dispara o comando de impressão via MQTT local.
 *
 * Pré-requisitos:
 * - Impressora com "LAN Mode" ativo (Settings → WLAN → LAN Mode)
 * - Access Code visível na tela da máquina
 * - Serial Number em (Settings → Device Information)
 */
export async function uploadAndPrintBambu(
  fullGcodePath: string,
  printerIp: string,
  accessCode: string,
  deviceSerial: string
): Promise<PrintStatus> {
  if (!fs.existsSync(fullGcodePath)) {
    return { success: false, message: `Arquivo G-code não encontrado: ${fullGcodePath}` };
  }

  const filename = path.basename(fullGcodePath);
  const remoteFilePath = `/sdcard/${filename}`;

  // ─── STEP 1: Upload via FTP TLS ────────────────────────────────────────
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: printerIp,
      port: 990,                  // Bambu Lab FTP port
      user: 'bblp',               // Always 'bblp' per Bambu protocol
      password: accessCode,       // Access Code from printer screen
      secure: true,               // FTP over TLS
      secureOptions: {
        rejectUnauthorized: false // Bambu uses self-signed cert
      }
    });

    console.log(`[BAMBU FTP] Conectado à impressora. Enviando ${filename}...`);
    await client.uploadFrom(fullGcodePath, remoteFilePath);
    console.log(`[BAMBU FTP] Upload concluído: ${remoteFilePath}`);

  } catch (ftpError: any) {
    console.error(`[BAMBU FTP] Falha no upload:`, ftpError);
    return { success: false, message: `Falha no upload FTP para a Bambu: ${ftpError.message}` };
  } finally {
    client.close();
  }

  // ─── STEP 2: Disparo via MQTT ───────────────────────────────────────────
  return new Promise((resolve) => {
    const mqttTopic = `device/${deviceSerial}/request`;
    const statusTopic = `device/${deviceSerial}/report`;

    // Build the print command payload
    const printPayload = {
      print: {
        sequence_id: Math.floor(Date.now() / 1000).toString(),
        command: 'project_file',
        param: `Metadata/plate_1.gcode`,
        url: `ftp:///sdcard/${filename}`,        // Reference to the uploaded file
        bed_type: 'auto',
        timelapse: false,
        bed_leveling: true,
        flow_cali: false,
        vibration_cali: true,
        layer_inspect: false,
        use_ams: false            // Set to true if you want to enable AMS
      }
    };

    const tlsOptions: tls.TlsOptions = {
      rejectUnauthorized: false
    };

    const mqttClient = mqtt.connect(`mqtts://${printerIp}:8883`, {
      username: 'bblp',
      password: accessCode,
      clientId: `brcprint_${Date.now()}`,
      rejectUnauthorized: false,
      reconnectPeriod: 0,        // Don't reconnect automatically
      connectTimeout: 8000,
    });

    const timeout = setTimeout(() => {
      console.error(`[BAMBU MQTT] Timeout ao conectar com ${printerIp}`);
      mqttClient.end(true);
      resolve({ success: false, message: `Timeout MQTT: impressora ${printerIp} não respondeu em 8s. Verifique LAN Mode.` });
    }, 10000);

    mqttClient.on('connect', () => {
      console.log(`[BAMBU MQTT] Conectado! Enviando comando de impressão...`);

      mqttClient.publish(mqttTopic, JSON.stringify(printPayload), { qos: 1 }, (err) => {
        clearTimeout(timeout);
        mqttClient.end(true);

        if (err) {
          console.error(`[BAMBU MQTT] Erro ao publicar mensagem:`, err);
          resolve({ success: false, message: `Erro ao enviar comando MQTT: ${err.message}` });
        } else {
          console.log(`[BAMBU MQTT] Comando de impressão enviado com sucesso para ${deviceSerial}`);
          resolve({ success: true, message: `Bambu Lab iniciando impressão de ${filename}! Verifique o visor.` });
        }
      });
    });

    mqttClient.on('error', (err: Error) => {
      clearTimeout(timeout);
      mqttClient.end(true);
      console.error(`[BAMBU MQTT] Erro de conexão:`, err);
      resolve({ success: false, message: `Erro MQTT Bambu: ${err.message}. Confirme que LAN Mode está ativo.` });
    });
  });
}
