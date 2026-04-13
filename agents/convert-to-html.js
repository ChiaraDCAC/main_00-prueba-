import { marked } from './node_modules/marked/lib/marked.esm.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    line-height: 1.7;
    color: #1a1a2e;
    background: #fff;
    padding: 48px 64px;
    max-width: 960px;
    margin: 0 auto;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #0f3460;
    border-bottom: 3px solid #0f3460;
    padding-bottom: 12px;
    margin-bottom: 24px;
    margin-top: 0;
  }

  h2 {
    font-size: 17px;
    font-weight: 700;
    color: #0f3460;
    background: #eef2ff;
    padding: 8px 14px;
    border-left: 4px solid #0f3460;
    margin-top: 36px;
    margin-bottom: 16px;
    border-radius: 0 6px 6px 0;
  }

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: #16213e;
    margin-top: 24px;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
  }

  h4 {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  p {
    margin-bottom: 12px;
    color: #334155;
  }

  ul, ol {
    padding-left: 22px;
    margin-bottom: 12px;
  }

  li {
    margin-bottom: 5px;
    color: #334155;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 12.5px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
    border-radius: 6px;
    overflow: hidden;
  }

  thead tr {
    background: #0f3460;
    color: #fff;
  }

  thead th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  tbody tr:hover {
    background: #eef2ff;
  }

  td {
    padding: 9px 14px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }

  code {
    background: #f1f5f9;
    color: #0f3460;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'Consolas', 'Courier New', monospace;
  }

  pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 18px 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 20px;
    font-size: 12px;
    line-height: 1.6;
    font-family: 'Consolas', 'Courier New', monospace;
  }

  pre code {
    background: none;
    color: #e2e8f0;
    padding: 0;
    font-size: 12px;
  }

  blockquote {
    border-left: 4px solid #0f3460;
    background: #eef2ff;
    padding: 10px 16px;
    margin: 16px 0;
    border-radius: 0 6px 6px 0;
    color: #334155;
    font-style: italic;
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 28px 0;
  }

  strong {
    color: #0f3460;
    font-weight: 600;
  }

  a { color: #0f3460; }

  @media print {
    body { padding: 20px 32px; }
    h2 { page-break-before: auto; }
    pre, table, blockquote { page-break-inside: avoid; }
  }
`;

const files = [
  'PRD-Alta-Usuario.md',
  'PRD-Operaciones-Inusuales.md',
  'PRD-Reportes.md',
  'PRD-Reportes-Regulatorios.md'
];

const dir = __dirname;

files.forEach(file => {
  const mdPath = path.join(dir, file);
  if (!fs.existsSync(mdPath)) {
    console.log(`Skipping ${file} — not found`);
    return;
  }
  const md = fs.readFileSync(mdPath, 'utf8');
  const body = marked.parse(md);
  const title = file.replace('.md', '');
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;
  const outPath = path.join(dir, file.replace('.md', '.html'));
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓ Generated: ${file.replace('.md', '.html')}`);
});

console.log('\nListo. Abri los archivos HTML en Edge o Chrome y usá Ctrl+P → "Guardar como PDF".');
