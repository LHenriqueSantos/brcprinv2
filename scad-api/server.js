const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const UPLOAD_DIR = '/tmp/scad-uploads';
const OUTPUT_DIR = '/app/outputs';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const upload = multer({ dest: UPLOAD_DIR });
app.use(express.json());

function run(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 10 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

/**
 * SCAD Renderer Route
 */
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
        const safeVal = val.replace(/"/g, '\\"');
        dArgs += `-D '${key}="${safeVal}"' `;
      } else {
        dArgs += `-D '${key}=${val}' `;
      }
    }

    const cmd = `openscad -o ${outPath} ${dArgs} "${rawPath}"`;
    console.log(`[SCAD-API] Rendering: ${cmd}`);

    await run(cmd);

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
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
    console.error('[SCAD-API] Error:', err.message);
    res.status(500).json({ error: 'Failed to compile SCAD to STL', details: err.message });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SCAD-API] Dedicated OpenSCAD Service active on port ${PORT}`);
});
