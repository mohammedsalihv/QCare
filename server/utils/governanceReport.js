const PDFDocument = require('pdfkit');
const path = require('node:path');
const assets = path.join(__dirname, '../assets/clinical-audit');
const C = { red: '#E51B2B', navy: '#17364D', muted: '#627488', pale: '#F1F5F9', line: '#C8D4DF', green: '#107C65', amber: '#946000', purple: '#6551A8' };
const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim() || 'Not recorded';
const date = (value, time = true) => !value || !Number.isFinite(new Date(value).getTime()) ? 'Not recorded' : new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}) });
const cell = (text, extra = {}) => ({ text: clean(text), ...extra });

/** Bordered, paginated tables. All report bytes are complete before the HTTP response is sent. */
module.exports = function governanceReport({ title, reference, reportLabel, status, statusColor = C.muted, approvalText, approvalColor = statusColor, metrics, generatedAt = new Date(), render }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', bufferPages: true, margins: { top: 113, bottom: 62, left: 46, right: 46 },
      info: { Title: `${reportLabel} - ${title}`, Author: 'Canadian Medical Center', Subject: reportLabel, Creator: 'QCare Portal' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    try {
      doc.registerFont('Body', path.join(assets, 'DejaVuSans.ttf'));
      doc.registerFont('Bold', path.join(assets, 'DejaVuSans-Bold.ttf'));
      const left = 46, width = doc.page.width - 92, bottom = doc.page.height - 65;
      let y = 113;
      const text = (value, x, top, size = 9, bold = false, color = C.navy) => {
        doc.font(bold ? 'Bold' : 'Body').fontSize(size).fillColor(color).text(String(value), x, top, { lineBreak: false });
      };
      const header = () => {
        doc.rect(0, 0, doc.page.width, 7).fill(C.red);
        doc.image(path.join(assets, 'cmc-logo.jpg'), left, 12, { width: 92, height: 92 });
        text('CANADIAN MEDICAL CENTER', left + 108, 35, 16, true);
        text('QUALITY & CLINICAL GOVERNANCE', left + 108, 60, 9, false, C.muted);
        doc.moveTo(left, 100).lineTo(left + width, 100).lineWidth(1).stroke(C.line);
        y = 113;
      };
      header();
      const nextPage = () => { doc.addPage(); header(); };
      const room = height => { if (y + height > bottom) nextPage(); };
      // Explicit line wrapping lets long table cells continue without clipping or losing other columns.
      const wrap = (value, maxWidth, size = 9, bold = false) => {
        doc.font(bold ? 'Bold' : 'Body').fontSize(size);
        const lines = [];
        for (const paragraph of clean(value).split(/\r?\n/)) {
          let line = '';
          for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            if (doc.widthOfString(line ? `${line} ${word}` : word) <= maxWidth) { line = line ? `${line} ${word}` : word; continue; }
            if (line) { lines.push(line); line = ''; }
            for (const char of word) {
              if (line && doc.widthOfString(line + char) > maxWidth) { lines.push(line); line = ''; }
              line += char;
            }
          }
          lines.push(line);
        }
        return lines;
      };
      const lines = (values, x, top, size = 9, bold = false, color = C.navy, leading = 13) => values.forEach((line, index) => text(line, x, top + index * leading, size, bold, color));
      const table = (number, title, columns, fractions, rows, description = '') => {
        const columnWidths = fractions.map(f => width * f);
        const headingHeight = 31 + (description ? 24 : 0) + (columns.length ? 26 : 0);
        let sectionTop;
        const finish = () => doc.rect(left, sectionTop, width, y - sectionTop).lineWidth(0.9).stroke(C.line);
        const begin = continued => {
          sectionTop = y;
          doc.rect(left, y, width, 31).fill(C.navy);
          doc.rect(left, y, 4, 31).fill(C.red);
          text(`${number}   ${title}${continued ? ' (continued)' : ''}`, left + 13, y + 8, 11, true, '#FFFFFF'); y += 31;
          if (description) { doc.rect(left, y, width, 24).fill('#F8FAFC'); text(description, left + 12, y + 6, 8, false, C.muted); y += 24; }
          if (columns.length) {
            let x = left;
            columns.forEach((title, index) => {
              doc.rect(x, y, columnWidths[index], 26).fillAndStroke(C.pale, C.line);
              text(title, x + 9, y + 7, 8, true, C.muted); x += columnWidths[index];
            }); y += 26;
          }
        };
        const normalized = rows.length ? rows : [[cell('No information recorded.', { color: C.muted })]];
        const prepared = normalized.map(row => {
          const widths = row.length === 1 ? [width] : columnWidths;
          return row.map((value, index) => {
            const item = typeof value === 'object' ? value : cell(value);
            return { ...item, width: widths[index], lines: wrap(item.text, widths[index] - 20, 9, item.bold) };
          });
        });
        const rowHeight = row => Math.max(...row.map(c => c.lines.length)) * 13 + 12 + (row.some(c => c.caption) ? 15 : 0);
        const wholeHeight = headingHeight + prepared.reduce((sum, row) => sum + rowHeight(row), 0);
        // Keep compact sections together; larger tables repeat their section and column headers.
        room(wholeHeight <= 300 ? wholeHeight : headingHeight + Math.min(rowHeight(prepared[0]), 90));
        begin(false);
        prepared.forEach((row, rowIndex) => {
          let continued = false;
          let remaining = Math.max(...row.map(c => c.lines.length));
          const captionHeight = row.some(c => c.caption) ? 15 : 0;
          while (remaining > 0) {
            const required = remaining * 13 + 12 + captionHeight;
            const fullPageCapacity = bottom - 113 - headingHeight;
            if ((required <= fullPageCapacity && y + required > bottom) || bottom - y < 12 + captionHeight + Math.min(remaining, 2) * 13) {
              finish(); nextPage(); begin(true);
            }
            const count = Math.min(remaining, Math.floor((bottom - y - 12 - captionHeight) / 13));
            const height = count * 13 + 12 + captionHeight;
            let x = left;
            row.forEach(item => {
              doc.rect(x, y, item.width, height).lineWidth(0.5).fillAndStroke(rowIndex % 2 ? '#F8FAFC' : '#FFFFFF', C.line);
              if (item.caption) text(item.caption.toUpperCase() + (continued ? ' (CONT.)' : ''), x + 10, y + 7, 7.5, true, C.muted);
              lines(item.lines.splice(0, count), x + 10, y + 8 + captionHeight, 9, item.bold, item.color || C.navy);
              x += item.width;
            });
            y += height; remaining = Math.max(...row.map(c => c.lines.length));
            if (remaining) { finish(); nextPage(); begin(true); continued = true; }
          }
        });
        finish(); y += 14;
      };
      text(reportLabel, left, y, 10, true, C.red); y += 22;
      const titleLines = wrap(title, width, 22, true);
      for (const line of titleLines) { room(32); text(line, left, y, 22, true); y += 29; }
      y += 7;
      const statusText = status, statusWidth = Math.min(width, doc.font('Bold').fontSize(9).widthOfString(statusText) + 22);
      room(102);
      doc.roundedRect(left, y, statusWidth, 23, 4).fill('#F0F4F8');
      text(statusText, left + 11, y + 5, 9, true, statusColor);
      text(approvalText, left + statusWidth + 12, y + 5, 9, false, approvalColor); y += 34;
      text(`Report reference: ${reference}`, left, y, 7.5, false, C.muted); y += 14;
      text(`Generated: ${date(generatedAt)} | Dubai (UTC+04:00)`, left, y, 7.5, false, C.muted); y += 25;
      room(80);
      const box = (width - 20) / 3;
      metrics.forEach(([value, caption], index) => {
        const x = left + index * (box + 10);
        doc.roundedRect(x, y, box, 63, 5).lineWidth(0.7).fillAndStroke(C.pale, C.line);
        doc.font('Bold').fontSize(18);
        const metricSize = Math.min(18, 18 * (box - 24) / Math.max(1, doc.widthOfString(String(value))));
        text(value, x + 12, y + 9, metricSize, true); text(caption, x + 12, y + 39, 8, false, C.muted);
      }); y += 79;
      render({ table });
      const range = doc.bufferedPageRange();
      for (let page = range.start; page < range.start + range.count; page++) {
        doc.switchToPage(page); doc.page.margins.bottom = 0;
        const fy = doc.page.height - 43;
        doc.moveTo(left, fy - 10).lineTo(left + width, fy - 10).lineWidth(0.6).stroke(C.line);
        text('CMC | Confidential - internal quality & governance', left, fy, 7, false, C.muted);
        const pageText = `Page ${page + 1} of ${range.count}`;
        doc.font('Body').fontSize(7); text(pageText, left + width - doc.widthOfString(pageText), fy, 7, false, C.muted);
        text(`Reference: ${reference}`, left, fy + 12, 7, false, C.muted);
      }
      doc.end();
    } catch (error) { doc.destroy(); reject(error); }
  });
};
