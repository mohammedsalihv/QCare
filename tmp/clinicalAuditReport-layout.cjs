const PDFDocument = require('pdfkit');
const path = require('node:path');
const assets = path.join(__dirname, '../assets/clinical-audit');
const C = { red: '#E51B2B', navy: '#17364D', muted: '#627488', pale: '#F1F5F9', line: '#C8D4DF', green: '#107C65', amber: '#946000', purple: '#6551A8' };
const label = value => String(value || 'Not specified').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim() || 'Not recorded';
const names = (items, key) => (items || []).map(item => item?.[key]).filter(Boolean).join(', ');
const person = value => value?.employeeName || 'Not recorded';
const date = (value, time = true) => !value || !Number.isFinite(new Date(value).getTime()) ? 'Not recorded' : new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', ...(time ? { timeStyle: 'short' } : {}) });
const time = value => !value || !Number.isFinite(new Date(value).getTime()) ? 'Not specified' : new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false });
const cell = (text, extra = {}) => ({ text: clean(text), ...extra });
const field = (caption, text) => cell(text, { caption });
const tone = status => ['non-compliant', 'overdue'].includes(status) ? C.red : ['compliant', 'completed'].includes(status) ? C.green : ['partial', 'pending-review'].includes(status) ? C.amber : status === 'in-progress' ? C.purple : C.muted;

/** Bordered, paginated tables. All report bytes are complete before the HTTP response is sent. */
module.exports = function clinicalAuditReport(audit, { generatedAt = new Date() } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', bufferPages: true, margins: { top: 113, bottom: 62, left: 46, right: 46 },
      info: { Title: `Clinical Audit - ${audit.auditTitle}`, Author: 'Canadian Medical Center', Subject: 'Clinical audit assessment and improvement report', Creator: 'QCare Portal' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    try {
      doc.registerFont('Body', path.join(assets, 'DejaVuSans.ttf'));
      doc.registerFont('Bold', path.join(assets, 'DejaVuSans-Bold.ttf'));
      const left = 46, width = doc.page.width - 92, bottom = doc.page.height - 65;
      const reference = String(audit._id || '').toUpperCase();
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
        const rowHeight = row => Math.max(...row.map(c => c.lines.length)) * 13 + 16 + (row.some(c => c.caption) ? 15 : 0);
        const wholeHeight = headingHeight + prepared.reduce((sum, row) => sum + rowHeight(row), 0);
        // Keep compact sections together; larger tables repeat their section and column headers.
        room(wholeHeight <= bottom - 113 ? wholeHeight : headingHeight + Math.min(rowHeight(prepared[0]), 90));
        begin(false);
        prepared.forEach((row, rowIndex) => {
          let continued = false;
          let remaining = Math.max(...row.map(c => c.lines.length));
          const captionHeight = row.some(c => c.caption) ? 15 : 0;
          while (remaining > 0) {
            const required = remaining * 13 + 16 + captionHeight;
            const fullPageCapacity = bottom - 113 - headingHeight;
            if ((required <= fullPageCapacity && y + required > bottom) || bottom - y < 16 + captionHeight + 26) {
              finish(); nextPage(); begin(true);
            }
            const count = Math.min(remaining, Math.floor((bottom - y - 16 - captionHeight) / 13));
            const height = count * 13 + 16 + captionHeight;
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
        finish(); y += 16;
      };
      text('CLINICAL AUDIT REPORT', left, y, 10, true, C.red); y += 22;
      const titleLines = wrap(audit.auditTitle, width, 22, true);
      for (const line of titleLines) { room(32); text(line, left, y, 22, true); y += 29; }
      y += 7;
      const draft = audit.status !== 'completed', statusColor = tone(audit.status);
      const statusText = label(audit.status), statusWidth = Math.min(width, doc.font('Bold').fontSize(9).widthOfString(statusText) + 22);
      room(102);
      doc.roundedRect(left, y, statusWidth, 23, 4).fill('#F0F4F8');
      text(statusText, left + 11, y + 5, 9, true, statusColor);
      text(draft ? 'Working report - not yet approved' : 'Approved assessment', left + statusWidth + 12, y + 5, 9, false, draft ? C.muted : C.green); y += 34;
      text(`Report reference: ${reference}`, left, y, 7.5, false, C.muted); y += 14;
      text(`Generated: ${date(generatedAt)} | Dubai (UTC+04:00)`, left, y, 7.5, false, C.muted); y += 25;
      const metrics = [[audit.overallScore == null || ['scheduled', 'overdue'].includes(audit.status) ? 'Not scored' : `${audit.overallScore}%`, 'Compliance score'], [`${audit.coverage ?? 0}%`, 'Assessment coverage'], [String((audit.improvementActions || []).filter(a => a.status !== 'completed').length), 'Open actions']];
      room(80);
      const box = (width - 20) / 3;
      metrics.forEach(([value, caption], index) => {
        const x = left + index * (box + 10);
        doc.roundedRect(x, y, box, 63, 5).lineWidth(0.7).fillAndStroke(C.pale, C.line);
        text(value, x + 12, y + 9, 18, true); text(caption, x + 12, y + 39, 8, false, C.muted);
      }); y += 79;
      const scope = [
        [field('Location', [audit.location?.name, audit.location?.code].filter(Boolean).join(' / ') || 'Not specified'), field('Standard / framework', audit.standard)],
        [field('Checklist template', audit.templateId?.templateName || 'Original template unavailable'), field('Governance pillar', label(audit.governancePillar))],
        [field('Audit type', label(audit.auditType)), field('Auditor', audit.auditorName || audit.auditor?.employeeName || 'Not specified')],
        [field('Concerned departments', names(audit.concernedDepartments, 'name') || audit.department || 'Not selected'), field('Concerned people', names(audit.concernedPersons, 'employeeName') || 'Not selected')]
      ];
      if (audit.frequency || audit.nextAuditDate) scope.push([field('Frequency', label(audit.frequency)), field('Next audit', date(audit.nextAuditDate, false))]);
      table('01', 'Audit scope', [], [0.5, 0.5], scope);
      const sessions = audit.sessions?.length ? audit.sessions : [{ startAt: audit.scheduledDate, endAt: audit.scheduledUntil }];
      const schedule = sessions.map((s, i) => [cell(`Visit ${i + 1}`, { bold: true }), date(s.startAt, false), `${time(s.startAt)} - ${s.endAt ? (date(s.endAt, false) === date(s.startAt, false) ? time(s.endAt) : date(s.endAt)) : 'End time not specified'}`]);
      if (audit.conductedDate) schedule.push([field('Assessment started', date(audit.conductedDate))]);
      table('02', 'Dates & timing', ['Visit', 'Date', 'Time window'], [0.16, 0.36, 0.48], schedule, 'All dates and times are shown in Dubai time (UTC+04:00).');
      const checklist = audit.criteriaSnapshot?.length ? audit.criteriaSnapshot : audit.templateId?.criteria || [], findings = audit.findings || [];
      const criteria = [...checklist, ...findings.filter(f => !checklist.some(c => c.criterionId === f.criterionId)).map(f => ({ criterionId: f.criterionId, text: 'Historical criterion' }))];
      const assessment = criteria.map((c, i) => {
        const f = findings.find(f => f.criterionId === c.criterionId), status = f?.complianceStatus || 'not-assessed';
        const evidence = [f?.evidence || 'Not recorded', f?.exclusionReason && `Exclusion reason: ${f.exclusionReason}`, f?.attachments?.length && `Evidence files: ${f.attachments.length} attachment(s) in the audit workspace`].filter(Boolean).join('\n\n');
        return [cell(`${i + 1}. ${c.text || c.criterionId}\n\n${c.criterionId}${c.weight != null ? ` | Weight: ${c.weight}` : ''}`, { bold: true }), cell(label(status), { color: tone(status), bold: true }), evidence];
      });
      table('03', 'Assessment findings', ['Criterion', 'Result', 'Evidence / observations'], [0.34, 0.19, 0.47], assessment.length ? assessment : [[cell('No assessment criteria recorded.', { color: C.muted })]], `Non-compliant: ${audit.nonCompliantCount || 0}   |   Partially compliant: ${audit.partialCount || 0}`);
      const actions = (audit.improvementActions || []).map((a, i) => [
        [ `${i + 1}. ${a.actionText}`, a.criterionId && `Criterion: ${a.criterionId}`, a.rootCause && `Root cause: ${a.rootCause}`, a.completionEvidence && `Completion evidence: ${a.completionEvidence}` ].filter(Boolean).join('\n\n'),
        `${person(a.owner)}\n\nDue: ${date(a.dueDate, false)}`,
        cell([label(a.status), `${label(a.priority)} priority`, a.verifiedAt && `Verified: ${person(a.verifiedBy)}\n${date(a.verifiedAt)}`].filter(Boolean).join('\n\n'), { color: tone(a.status) })
      ]);
      table('04', 'Corrective action plan', ['Action / follow-up', 'Owner / due date', 'Status / priority'], [0.48, 0.25, 0.27], actions.length ? actions : [[cell('No corrective actions recorded.', { color: C.muted })]]);
      table('05', 'Review & approval', [], [0.5, 0.5], [
        [field('Submitted by', `${person(audit.submittedBy)}${audit.submittedAt ? `\n${date(audit.submittedAt)}` : ''}`), field('Reviewed by', `${person(audit.reviewedBy)}${audit.reviewedAt ? `\n${date(audit.reviewedAt)}` : ''}`)],
        [field('Review comments', audit.reviewComment || 'No review comments recorded')],
        [cell(draft ? 'Approval is pending. This report reflects the current audit record.' : 'Approval details reflect the recorded independent review in QCare.', { color: draft ? C.amber : C.green })]
      ]);
      table('06', 'Activity record', ['Date & time', 'Activity', 'Recorded by'], [0.27, 0.43, 0.30], (audit.history || []).map(e => [date(e.at), `${label(e.event)}${e.detail ? `\n${e.detail}` : ''}`, person(e.actor)]));
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

module.exports.filename = (audit, generatedAt = new Date()) => {
  const readable = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 65).replace(/_+$/g, '');
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(generatedAt);
  return ['CMC', 'Clinical_Audit', readable(audit.auditTitle) || 'Report', readable(audit.location?.name || audit.location?.code), day].filter(Boolean).join('_') + '.pdf';
};
