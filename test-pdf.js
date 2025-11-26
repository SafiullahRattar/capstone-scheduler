const fs = require('fs');
const { PdfReader } = require('pdfreader');

function extractTextFromPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    const rows = {}; // {y: {x: text}}
    
    new PdfReader().parseFileItems(pdfPath, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        // End of file - assemble text
        const sortedRows = Object.keys(rows).sort((a, b) => parseFloat(a) - parseFloat(b));
        const text = sortedRows.map(y => {
          const row = rows[y];
          const sortedCols = Object.keys(row).sort((a, b) => parseFloat(a) - parseFloat(b));
          return sortedCols.map(x => row[x]).join(' ');
        }).join('\n');
        resolve(text);
      } else if (item.text) {
        // Accumulate text items by position
        const y = item.y.toFixed(1);
        const x = item.x.toFixed(1);
        if (!rows[y]) rows[y] = {};
        rows[y][x] = item.text;
      }
    });
  });
}

extractTextFromPDF('./safiauditpdf.pdf')
  .then(text => {
    console.log(text);
  })
  .catch(err => {
    console.error('Error:', err);
  });
