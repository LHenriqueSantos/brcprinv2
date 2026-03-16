const fs = require('fs');
const AdmZip = require('adm-zip');

function inspect() {
  const filePath = './public/uploads/1772906267843-leo.3mf';
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    console.log("Arquivos no ZIP:");
    zipEntries.forEach(function (zipEntry) {
      console.log("- " + zipEntry.entryName);
    });

    const sliceInfo = zip.getEntry("Metadata/slice_info.config");
    if (sliceInfo) {
      console.log("\n--- CONTEÚDO DE Metadata/slice_info.config ---");
      console.log(zip.readAsText(sliceInfo));
    }
  } catch (e) {
    console.error("Erro:", e.message);
  }
}

inspect();
