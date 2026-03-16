const express = require('express');
const multer = require('multer');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();

// Absolute paths — never relative to cwd
const UPLOAD_DIR = '/tmp/slicer-uploads';
const OUTPUT_DIR = '/app/outputs';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });
app.use(express.json());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

function parseGcode(gcodePath) {
  try {
    const stats = fs.statSync(gcodePath);
    const readBytes = Math.min(20000, stats.size);
    const buf = Buffer.alloc(readBytes);
    const fd = fs.openSync(gcodePath, 'r');
    fs.readSync(fd, buf, 0, readBytes, stats.size - readBytes);
    fs.closeSync(fd);
    const txt = buf.toString('utf-8');

    let weight_g = 0, time_hours = 0.5;

    const wm = txt.match(/; filament used \[g\] = ([0-9.]+)/);
    if (wm) weight_g = parseFloat(wm[1]);

    if (weight_g < 0.01) {
      const vm = txt.match(/; filament used \[cm3\] = ([0-9.]+)/);
      if (vm) weight_g = parseFloat(vm[1]) * 1.25;
    }

    const tm = txt.match(/; estimated printing time \(normal mode\) = (.*)/);
    if (tm) {
      const s = tm[1].trim();
      const h = s.match(/(\d+)h/), m = s.match(/(\d+)m/), sc = s.match(/(\d+)s/);
      time_hours = (h ? parseInt(h[1]) : 0) + (m ? parseInt(m[1]) / 60 : 0) + (sc ? parseInt(sc[1]) / 3600 : 0);
    }

    if (weight_g < 0.1) weight_g = 1;
    return {
      weight_g: parseFloat(weight_g.toFixed(2)),
      time_hours: parseFloat(time_hours.toFixed(2)),
      warning: txt.includes('not all objects could be arranged'),
    };
  } catch (e) {
    return { weight_g: 1, time_hours: 0.5, warning: false };
  }
}

/**
 * Estimate print stats from file size alone (fallback when slicing fails).
 * Approximate: 1 MB ≈ 10g, 0.5h per 10g at typical 40mm/s.
 */
function estimateFromFileSize(filePath, quantity = 1) {
  try {
    const bytes = fs.statSync(filePath).size;
    const mb = bytes / (1024 * 1024);
    const weight_g = parseFloat(Math.max(1, mb * 12 * quantity).toFixed(2));
    const time_hours = parseFloat(Math.max(0.5, mb * 0.6 * quantity).toFixed(2));
    return { weight_g, time_hours, warning: false, estimated: true };
  } catch {
    return { weight_g: 5 * quantity, time_hours: 1 * quantity, warning: false, estimated: true };
  }
}

/**
 * Try to extract the printable mesh from a 3MF file (which is a ZIP).
 * Bambu Studio 3MF files store the mesh at Metadata/plate_1.gcode or
 * 3D/3dmodel.model (XML geometry) — we look for any embedded STL first.
 */
async function extract3mfToStl(threeMfPath, destDir) {
  // List zip contents
  try {
    const { stdout } = await run(`unzip -l ${threeMfPath}`);

    // Look for an embedded STL inside the 3MF ZIP
    const stlInZip = stdout.split('\n')
      .map(l => l.trim())
      .filter(l => l.toLowerCase().endsWith('.stl'))
      .map(l => l.split(/\s+/).pop())
      .filter(Boolean);

    if (stlInZip.length > 0) {
      const firstStl = stlInZip[0];
      await run(`unzip -o ${threeMfPath} "${firstStl}" -d ${destDir}`);
      const extractedPath = path.join(destDir, firstStl);
      if (fs.existsSync(extractedPath) && fs.statSync(extractedPath).size > 100) {
        console.log(`[SLICER] Extracted STL from 3MF: ${firstStl}`);
        return extractedPath;
      }
    }

    // Look for 3dmodel.model (OPC XML geometry)
    const modelFiles = stdout.split('\n')
      .map(l => l.trim())
      .filter(l => l.endsWith('.model'))
      .map(l => l.split(/\s+/).pop())
      .filter(Boolean);

    if (modelFiles.length > 0) {
      // Extract the first model file
      const modelFile = modelFiles[0];
      const xmlDestPath = path.join(destDir, path.basename(modelFile));
      await run(`unzip -o ${threeMfPath} "${modelFile}" -d ${destDir}`);

      // PrusaSlicer can sometimes open .model files directly — rename to .3mf and try
      // Actually, just return null and let caller use file-size estimate
    }
  } catch (e) {
    console.warn(`[SLICER] Failed to inspect 3MF ZIP: ${e.message}`);
  }
  return null;
}

// ─── Route ────────────────────────────────────────────────────────────────────

app.post('/slice', upload.array('files'), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided.' });
  }

  let quantities = {};
  let scales = {};
  try {
    if (req.body.quantities) {
      quantities = typeof req.body.quantities === 'string'
        ? JSON.parse(req.body.quantities)
        : req.body.quantities;
    }
    if (req.body.scales) {
      scales = typeof req.body.scales === 'string'
        ? JSON.parse(req.body.scales)
        : req.body.scales;
    }
  } catch (e) { console.error('[SLICER] JSON parse error:', e); }

  const infill = req.body.infill ? parseInt(req.body.infill, 10) : 20;
  const tempFiles = [];
  const fileArgs = [];

  try {
    console.log(`[SLICER] Received ${files.length} file(s), infill=${infill}%`);

    // ── Step 1: Rename to correct extension ──
    for (const file of files) {
      const origExt = path.extname(file.originalname).toLowerCase() || '.stl';
      const allowed = ['.stl', '.obj', '.3mf', '.amf'];
      const ext = allowed.includes(origExt) ? origExt : '.stl';

      const rawPath = path.resolve(file.path);
      const rawWithExt = rawPath + ext;
      fs.renameSync(rawPath, rawWithExt);
      tempFiles.push(rawWithExt);

      fileArgs.push({
        raw: rawWithExt,
        fixed: rawWithExt,
        originalName: file.originalname,
        ext,
        count: parseInt(quantities[file.originalname] || '1', 10),
        scale: parseFloat(scales[file.originalname] || '1'),
      });
    }

    // ── Step 2: Heal STL files ──
    for (const item of fileArgs) {
      if (item.ext !== '.stl') continue;
      const healedPath = item.raw.replace(/\.stl$/, '_fixed.stl');
      tempFiles.push(healedPath);
      try {
        await run(`admesh --write-binary-stl=${healedPath} ${item.raw}`);
        if (fs.existsSync(healedPath) && fs.statSync(healedPath).size > 100) {
          item.fixed = healedPath;
          console.log(`[SLICER] Healed STL: ${item.originalName}`);
        }
      } catch (e) {
        console.warn(`[SLICER] admesh failed for ${item.originalName}:`, e.message);
      }
    }

    // ── Step 3: Try to expand 3MF files to STL ──
    for (const item of fileArgs) {
      if (item.ext !== '.3mf' && item.ext !== '.amf') continue;
      const extractDir = path.join(UPLOAD_DIR, `extract_${item.fixed.split('/').pop()}`);
      fs.mkdirSync(extractDir, { recursive: true });
      tempFiles.push(extractDir);

      const extracted = await extract3mfToStl(item.raw, extractDir);
      if (extracted) {
        item.fixed = extracted;
        item.ext = '.stl'; // Now treat as STL for slicing
        tempFiles.push(extracted);
        console.log(`[SLICER] 3MF converted to STL: ${extracted}`);
      }
      // If extraction fails, item.ext stays .3mf and we'll try PrusaSlicer natively
    }

    // ── Step 4: Classify and slice ──
    const meshItems = fileArgs.filter(i => i.ext === '.stl' || i.ext === '.obj');
    const projItems = fileArgs.filter(i => i.ext === '.3mf' || i.ext === '.amf');

    let totalWeight = 0;
    let totalTime = 0;
    let hasEstimate = false;

    // STL/OBJ batch (Slicing separately to allow independent scaling and bypass build plate limits)
    for (const item of meshItems) {
      const gcPath = path.join(OUTPUT_DIR, `mesh_${Date.now()}_${Math.random().toString(36).substring(7)}.gcode`);
      tempFiles.push(gcPath);
      let cmd = `prusa-slicer --export-gcode --layer-height 0.2 --support-material --center 110,110 --fill-density ${infill}%`;
      if (item.scale && item.scale !== 1) {
        cmd += ` --scale ${item.scale}`;
      }
      cmd += ` ${item.fixed}`;
      cmd += ` -o ${gcPath}`;
      console.log(`[SLICER] Mesh slice: ${cmd}`);
      try {
        await run(cmd);
        if (fs.existsSync(gcPath) && fs.statSync(gcPath).size > 100) {
          const r = parseGcode(gcPath);
          totalWeight += r.weight_g * item.count;
          totalTime += r.time_hours * item.count;
          console.log(`[SLICER] Mesh result for ${item.originalName}: ${r.weight_g}g / ${r.time_hours}h x ${item.count} un`);
        } else {
          throw new Error('Gcode not generated or too small');
        }
      } catch (e) {
        console.warn(`[SLICER] PrusaSlicer failed for ${item.originalName}: ${e.message}`);
        const est = estimateFromFileSize(item.raw, item.count); // already multiplied by item.count
        const volScale = Math.pow(item.scale || 1, 3);
        totalWeight += est.weight_g * volScale;
        totalTime += est.time_hours * volScale;
        hasEstimate = true;
      }
    }

    // 3MF/AMF batch — try PrusaSlicer directly first, fallback to size estimate
    for (const item of projItems) {
      const gcPath = path.join(OUTPUT_DIR, `proj_${Date.now()}_${Math.random().toString(36).substring(7)}.gcode`);
      tempFiles.push(gcPath);
      let sliced = false;
      try {
        let cmd = `prusa-slicer --export-gcode ${item.fixed}`;
        if (item.scale && item.scale !== 1) {
          cmd += ` --scale ${item.scale}`;
        }
        cmd += ` -o ${gcPath}`;
        console.log(`[SLICER] Project slice: ${cmd}`);
        await run(cmd);
        if (fs.existsSync(gcPath) && fs.statSync(gcPath).size > 100) {
          const r = parseGcode(gcPath);
          totalWeight += r.weight_g * item.count;
          totalTime += r.time_hours * item.count;
          console.log(`[SLICER] 3MF slice result: ${r.weight_g}g / ${r.time_hours}h x ${item.count} un`);
          sliced = true;
        }
      } catch (e) {
        console.warn(`[SLICER] PrusaSlicer failed for ${item.originalName}: ${e.message}`);
      }

      if (!sliced) {
        // Fallback: Try advanced Python 3MF extractor first
        let usedPythonEstimate = false;
        if (item.ext === '.3mf' || item.ext === '.amf') {
          try {
            console.log(`[SLICER] Trying Python volume extraction for ${item.originalName}...`);
            const { stdout } = await run(`python3 /app/calc_3mf_volume.py "${item.raw}" ${infill}`);
            const result = JSON.parse(stdout.trim());
            if (result.weight_g > 0) {
              const volScale = Math.pow(item.scale || 1, 3);
              totalWeight += result.weight_g * item.count * volScale;
              totalTime += result.time_hours * item.count * volScale;
              console.log(`[SLICER] Python 3MF extract result: ${result.weight_g}g / ${result.time_hours}h`);
              usedPythonEstimate = true;
            }
          } catch (pyErr) {
            console.warn(`[SLICER] Python 3MF extraction failed:`, pyErr.message);
          }
        }

        if (!usedPythonEstimate) {
          // Absolute Last Resort: estimate from file size
          const est = estimateFromFileSize(item.raw, item.count);
          const volScale = Math.pow(item.scale || 1, 3);
          totalWeight += est.weight_g * volScale;
          totalTime += est.time_hours * volScale;
          hasEstimate = true; // Flag for generic MB guess
          console.log(`[SLICER] Using size-based estimate for ${item.originalName}: ${est.weight_g}g / ${est.time_hours}h x scale`);
        }
      }
    }

    // Cleanup
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) {
          const stat = fs.statSync(f);
          if (stat.isDirectory()) fs.rmSync(f, { recursive: true, force: true });
          else fs.unlinkSync(f);
        }
      } catch (_) { }
    }

    if (totalWeight < 0.1) totalWeight = 1;

    console.log(`[SLICER] Final: ${totalWeight.toFixed(2)}g / ${totalTime.toFixed(2)}h (estimate=${hasEstimate})`);

    res.json({
      success: true,
      weight_g: parseFloat(totalWeight.toFixed(2)),
      print_time_hours: parseFloat(totalTime.toFixed(2)),
      gcode_url: null,
      estimated: hasEstimate,
      nesting_warning: null,
    });

  } catch (err) {
    for (const f of tempFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) { }
    }
    console.error('[SLICER] Fatal error:', err.message);
    res.status(500).json({ error: 'Batch slicing failed.', details: err.message });
  }
});

// ─── SCAD Renderer Route ────────────────────────────────────────────────────────
app.post('/render-scad', upload.single('scad_file'), async (req, res) => {
  const scadFile = req.file;
  if (!scadFile) {
    return res.status(400).json({ error: 'No SCAD file provided.' });
  }

  let params = {};
  if (req.body.parameters) {
    try {
      params = typeof req.body.parameters === 'string' ? JSON.parse(req.body.parameters) : req.body.parameters;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid parameters JSON format' });
    }
  }

  const rawPath = path.resolve(scadFile.path);
  const outPath = path.join(OUTPUT_DIR, `render_${Date.now()}.stl`);

  try {
    // Build the -D arguments
    let dArgs = '';
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === 'string') {
        // SCAD expects strings to be quoted: -D 'first_word="John"'
        // Need to escape inner quotes
        const safeVal = val.replace(/"/g, '\\"');
        dArgs += `-D '${key}="${safeVal}"' `;
      } else {
        dArgs += `-D '${key}=${val}' `;
      }
    }

    const cmd = `openscad -o ${outPath} ${dArgs} "${rawPath}"`;
    console.log(`[SLICER] Rendering SCAD: ${cmd}`);

    await run(cmd);

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
      // Return STL as a downloadable octet-stream
      res.download(outPath, 'custom_model.stl', (err) => {
        // Cleanup after download
        try { fs.unlinkSync(rawPath); } catch (_) { }
        try { fs.unlinkSync(outPath); } catch (_) { }
      });
    } else {
      throw new Error("OpenSCAD did not output an STL file");
    }

  } catch (err) {
    try { fs.unlinkSync(rawPath); } catch (_) { }
    try { fs.unlinkSync(outPath); } catch (_) { }
    console.error('[SLICER] SCAD Render error:', err.message);
    res.status(500).json({ error: 'Failed to compile SCAD to STL', details: err.message });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SLICER] Headless Slicer API active on port ${PORT}`);
});
