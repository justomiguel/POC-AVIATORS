/**
 * Genera PDFs de success cases desde AI Credentials.xlsx.
 * Uso: node scripts/generate-ai-credentials-pdfs.mjs [ruta-xlsx] [carpeta-salida]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const xlsxPath =
  process.argv[2] ||
  path.join(process.env.HOME || '', 'Downloads', 'AI Credentials.xlsx');
const outDir = path.resolve(process.argv[3] || path.join(repoRoot, 'generated-credentials'));

const NS = { ss: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };

function readSharedStrings(xlsx) {
  const xml = execFileSync('unzip', ['-p', xlsx, 'xl/sharedStrings.xml'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  const strings = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const parts = [];
    const tre = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tm;
    while ((tm = tre.exec(block))) {
      parts.push(
        tm[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'"),
      );
    }
    strings.push(parts.join(''));
  }
  return strings;
}

function colLetters(ref) {
  return ref.replace(/[0-9]/g, '');
}

function readSheetRows(xlsx, strings) {
  const xml = execFileSync('unzip', ['-p', xlsx, 'xl/worksheets/sheet1.xml'], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const rows = [];
  const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const rowNum = Number(rm[1]);
    const rowXml = rm[2];
    const cells = {};
    const cellRe = /<c[^>]*r="([A-Z]+)(\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(rowXml))) {
      const col = cm[1];
      const attrs = cm[3];
      const body = cm[4];
      const typ = /t="([^"]+)"/.exec(attrs);
      const t = typ ? typ[1] : '';
      const vMatch = /<v>([\s\S]*?)<\/v>/.exec(body);
      const raw = vMatch ? vMatch[1] : '';
      let val = raw;
      if (t === 's' && raw !== '') val = strings[Number(raw)] ?? '';
      cells[col] = val;
    }
    rows.push({ rowNum, cells });
  }
  return rows;
}

function cleanText(v) {
  return String(v || '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlaceholder(v) {
  const t = cleanText(v).toLowerCase();
  return (
    !t ||
    t === 'not provided' ||
    t === 'not specified' ||
    t === 'not mentioned' ||
    t === 'not specified  '
  );
}

function safeFileStem(client, index) {
  const base = cleanText(client)
    .replace(/[\\/:*?"<>|#%{}~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70);
  const stem = base || `case-${index}`;
  return `${String(index).padStart(2, '0')} - ${stem}`;
}

function parseImpact(results) {
  const text = cleanText(results);
  if (!text || isPlaceholder(text)) return { metric: '', value: '' };
  const pct = text.match(/(\d+(?:\.\d+)?%)/);
  if (pct) {
    const before = text.slice(0, pct.index).trim();
    const metric = before.split(/[,.]/).pop()?.trim() || 'Outcome';
    return { metric, value: pct[1] };
  }
  return { metric: 'Results', value: text.slice(0, 200) };
}

function buildTags(tech, technique) {
  const tags = new Set(['AI', 'Data & AI']);
  for (const part of [tech, technique].join(',').split(/[,;|]/)) {
    const t = cleanText(part);
    if (t && !isPlaceholder(t)) tags.add(t);
  }
  return [...tags];
}

function buildNotes(row) {
  const parts = [];
  const fields = [
    ['Contacts', row.G],
    ['Duration', row.H],
    ['Project team', row.I],
    ['Price', row.J],
    ['Dates', row.K],
    ['Partners/vendors', row.N],
    ['Source file', row.P],
  ];
  for (const [label, val] of fields) {
    const v = cleanText(val);
    if (!isPlaceholder(v)) parts.push(`${label}: ${v}`);
  }
  return parts.join('\n');
}

function buildTitle(client, summary) {
  const s = cleanText(summary);
  if (s.length <= 120) return s || cleanText(client) || 'Success Case';
  const cut = s.slice(0, 117).trim();
  const sp = cut.lastIndexOf(' ');
  return (sp > 40 ? cut.slice(0, sp) : cut) + '…';
}

function writePdf(filePath, caseData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const sections = [
      ['Success Case', caseData.title, { fontSize: 16, bold: true }],
      ['Client', caseData.client, {}],
      ['Industry', caseData.industry, {}],
      ['Summary', caseData.summary, {}],
      ['Challenge', caseData.challenge, {}],
      ['Solution', caseData.solution, {}],
      ['Results / Impact', caseData.results, {}],
      ['Tech stack', caseData.techStack, {}],
      ['Technique', caseData.technique, {}],
      ['Source URL', caseData.externalUrl, { link: caseData.externalUrl }],
      ['Additional notes', caseData.notes, {}],
    ];

    doc.fontSize(20).font('Helvetica-Bold').text('Globant — AI Success Case', {
      align: 'center',
    });
    doc.moveDown(1.2);

    for (const [heading, body, opts] of sections) {
      const text = cleanText(body);
      if (!text || isPlaceholder(text)) continue;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(heading);
      doc.moveDown(0.25);
      doc.fontSize(10).font('Helvetica').fillColor('#334155');
      if (opts.link) {
        doc.fillColor('#0369a1').text(text, { link: opts.link, underline: true });
        doc.fillColor('#334155');
      } else {
        doc.text(text, { align: 'left', lineGap: 2 });
      }
      doc.moveDown(0.8);
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(xlsxPath)) {
    console.error('No se encontró el xlsx:', xlsxPath);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const strings = readSharedStrings(xlsxPath);
  const sheetRows = readSheetRows(xlsxPath, strings);
  const dataRows = sheetRows.filter((r) => r.rowNum > 1);

  const cases = [];
  let index = 0;

  for (const row of dataRows) {
    const c = row.cells;
    const client = cleanText(c.A);
    if (!client) continue;
    index += 1;

    const summary = cleanText(c.B);
    const challenge = cleanText(c.C);
    const solution = cleanText(c.D);
    const results = cleanText(c.E);
    const industry = cleanText(c.F);
    const techStack = cleanText(c.L);
    const technique = cleanText(c.M);
    const externalUrl = cleanText(c.O) || '';
    const sourceFile = cleanText(c.P);
    const impact = parseImpact(results);
    const notes = buildNotes(c);
    const title = buildTitle(client, summary);
    const fileStem = safeFileStem(client, index);
    const fileName = `${fileStem}.pdf`;

    const caseData = {
      title,
      client,
      industry,
      summary,
      challenge,
      solution,
      results,
      techStack,
      technique,
      externalUrl,
      notes,
    };

    const pdfPath = path.join(outDir, fileName);
    await writePdf(pdfPath, caseData);

    cases.push({
      row: row.rowNum,
      fileName,
      externalUrl: externalUrl || null,
      common: {
        title,
        summary,
        client_name: client,
        industry,
        tags: buildTags(techStack, technique),
        file_name: fileName,
        mime_type: 'application/pdf',
      },
      specific: {
        challenge,
        solution,
        impact_metric: impact.metric,
        impact_value: impact.value,
        evidence: sourceFile && !isPlaceholder(sourceFile) ? `Source: ${sourceFile}` : '',
        notes,
      },
    });
  }

  const mapping = {
    generatedAt: new Date().toISOString(),
    sourceXlsx: xlsxPath,
    outputDir: outDir,
    externalUrlDefault:
      cases.find((c) => c.externalUrl)?.externalUrl ||
      'https://drive.google.com/drive/folders/16vov9rX1wYJakQH0hzvrXFLEklNR2k2n',
    totalCases: cases.length,
    cases,
  };

  fs.writeFileSync(path.join(outDir, 'mapping.json'), JSON.stringify(mapping, null, 2), 'utf8');

  console.log(`Generados ${cases.length} PDFs en ${outDir}`);
  console.log(`Mapping: ${path.join(outDir, 'mapping.json')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
