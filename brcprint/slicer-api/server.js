const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();

// Parse form-data for STL uploads - supporting multiple files for nesting (Phase 59)
const upload = multer({ dest: 'uploads/' });
app.use(express.json());

app.post('/slice', upload.array('files'), (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided in the "files" field.' });
  }

  // quantities mapping: filenames (original) -> count
  let quantities = {};
  try {
    if (req.body.quantities) {
      quantities = typeof req.body.quantities === 'string' ? JSON.parse(req.body.quantities) : req.body.quantities;
    }
  } catch (e) {
    console.error("[SLICER] Error parsing quantities:", e);
  }

  const infill = req.body.infill ? parseInt(req.body.infill, 10) : 20;

  // Track temporary files for cleanup
  const tempFilesToCleanup = [];
  const stlFileArgs = [];

  console.log(`[SLICER] Received batch of ${files.length} files for nesting and slicing...`);

  // Prepare each file
  files.forEach(file => {
    const rawStlPath = file.path + '.stl';
    fs.renameSync(file.path, rawStlPath);
    tempFilesToCleanup.push(rawStlPath);

    // Fixed output for this specific file (healed version)
    const fixedStlFilename = `${file.filename}_fixed.stl`;
    const fixedStlPath = path.join(__dirname, 'uploads', fixedStlFilename);
    tempFilesToCleanup.push(fixedStlPath);

    // Healing first (sequential or we can try to build a chain of commands)
    // For simplicity in this step, let's assume we use the raw files OR heal them first.
    // To keep it robust, we'll heal each one.
    stlFileArgs.push({
      raw: rawStlPath,
      fixed: fixedStlPath,
      originalName: file.originalname,
      count: quantities[file.originalname] || 1
    });
  });

  // Since healing is per-file, we'll heal them all sequentially before fatiamento
  const healAll = async () => {
    for (const item of stlFileArgs) {
      const healCommand = `admesh --write-binary-stl=${item.fixed} ${item.raw}`;
      try {
        await new Promise((resolve, reject) => {
          exec(healCommand, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (e) {
        console.error(`[SLICER] Failed to heal ${item.originalName}:`, e);
        // Fallback to raw if healing fails? No, better safe than sorry.
        item.fixed = item.raw;
      }
    }
  };

  healAll().then(() => {
    // Stage 2: Slice everything together
    const gcodeFilename = `batch_${Date.now()}.gcode`;
    const gcodePath = path.join(__dirname, 'outputs', gcodeFilename);

    // Build the command: prusa-slicer item1.stl --duplicate 5 item2.stl --duplicate 2 --arrange ...
    let sliceCommand = `prusa-slicer --export-gcode --layer-height 0.2 --support-material --center 110,110 --fill-density ${infill}%`;

    stlFileArgs.forEach(item => {
      sliceCommand += ` ${item.fixed}`;
      if (item.count > 1) {
        sliceCommand += ` --duplicate ${item.count - 1}`; // --duplicate N adds N copies (total N+1)
      }
    });

    // Add Nesting flag
    sliceCommand += ` --merge -o ${gcodePath}`;

    console.log(`[SLICER] Executing batch slice: ${sliceCommand}`);

    exec(sliceCommand, (error, stdout, stderr) => {
      // Immediate cleanup of STL files
      tempFilesToCleanup.forEach(f => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { }
      });

      if (error) {
        console.error(`[SLICER] Batch Slicing error:`, error);
        return res.status(500).json({ error: 'Batch slicing failed.', details: stderr });
      }

      try {
        const stats = fs.statSync(gcodePath);
        const fileSize = stats.size;
        let readBytes = 15000;
        if (fileSize < readBytes) readBytes = fileSize;

        const buffer = Buffer.alloc(readBytes);
        const fd = fs.openSync(gcodePath, 'r');
        fs.readSync(fd, buffer, 0, readBytes, fileSize - readBytes);
        fs.closeSync(fd);

        const endContent = buffer.toString('utf-8');

        // Check for batch split warning (if everything didn't fit)
        const itemsNotPlaced = endContent.includes("not all objects could be arranged");

        let weight_g = 0;
        let time_hours = 0.5;

        const weightMatch = endContent.match(/; filament used \[g\] = ([0-9.]+)/);
        if (weightMatch && weightMatch[1]) {
          weight_g = parseFloat(weightMatch[1]);
        }

        // PrusaSlicer sometimes outputs 0.00 for [g] if density is not set in config, but outputs [cm3]
        if (weight_g === 0) {
          const volMatch = endContent.match(/; filament used \[cm3\] = ([0-9.]+)/);
          if (volMatch && volMatch[1]) {
            weight_g = parseFloat(volMatch[1]) * 1.25; // fallback standard PLA density
          }
        }

        const timeMatch = endContent.match(/; estimated printing time \(normal mode\) = (.*)/);
        if (timeMatch && timeMatch[1]) {
          let timeStr = timeMatch[1].trim();
          let hours = 0, minutes = 0, seconds = 0;
          const hMatch = timeStr.match(/(\d+)h/); if (hMatch) hours = parseInt(hMatch[1], 10);
          const mMatch = timeStr.match(/(\d+)m/); if (mMatch) minutes = parseInt(mMatch[1], 10);
          const sMatch = timeStr.match(/(\d+)s/); if (sMatch) seconds = parseInt(sMatch[1], 10);
          time_hours = hours + (minutes / 60.0) + (seconds / 3600.0);
        }

        if (weight_g < 0.1) weight_g = 1;

        console.log(`[SLICER] Batch Success. Weight: ${weight_g}g | Time: ${time_hours.toFixed(2)}h`);

        res.json({
          success: true,
          weight_g: parseFloat(weight_g.toFixed(2)),
          print_time_hours: parseFloat(time_hours.toFixed(2)),
          gcode_url: `/outputs/${gcodeFilename}`,
          nesting_warning: itemsNotPlaced ? "Algumas peças não couberam na mesma bandeja e foram ignoradas ou sobrepostas." : null
        });

      } catch (parseError) {
        if (fs.existsSync(gcodePath)) fs.unlinkSync(gcodePath);
        res.status(500).json({ error: 'Failed to process batch G-code output.' });
      }
    });
  }).catch(err => {
    res.status(500).json({ error: 'Internal failure during healing/slicing chain.' });
  });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SLICER] Headless Slicer API active and listening on port ${PORT}`);
});
