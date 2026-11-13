const PDFDocument = require('pdfkit');
module.exports = function documentTemplate(content, version, published = false, downloadedBy = '') {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: { Title: content.name, Author: 'QCare document control' } });
    const buffers = []; pdf.on('data', part => buffers.push(part)); pdf.on('error', reject); pdf.on('end', () => resolve({ name: `${content.ref.replace(/[^a-zA-Z0-9_-]/g, '_')}-v${version}.pdf`, mime: 'application/pdf', data: Buffer.concat(buffers) }));
    pdf.fillColor('#21665c').fontSize(10).text('QCARE | CONTROLLED DOCUMENT');
    pdf.moveDown().fillColor('#183c43').fontSize(22).text(content.name);
    pdf.moveDown().fontSize(11).text(`${content.type} | ${content.ref} | Version ${version}`);
    pdf.text(`Department: ${content.department}`);
    pdf.text(published ? 'Published version' : 'DRAFT - NOT APPROVED FOR USE');
    const date = value => new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' });
    pdf.text(`Effective: ${date(content.revisedDate)} | Review due: ${date(content.nextRevDate)}`);
    if (content.expiryDate) pdf.text(`Expires: ${date(content.expiryDate)}`);
    pdf.moveDown().fontSize(12).text(content.description || '');
    pdf.moveDown().fontSize(11).fillColor('#263f46').text(content.generatedText || '', { lineGap: 5 });
    pdf.moveDown().fontSize(10).text(`Change summary: ${content.changeSummary || 'Not provided'}`);
    const range = pdf.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      pdf.switchToPage(i);
      pdf.save(); pdf.fillColor('#61757b').fontSize(8).text(`${published ? 'Check the portal for the current version.' : 'Draft copy. Approval is required.'} Page ${i + 1} of ${range.count}`, 50, 780, { lineBreak: false });
      if (downloadedBy) pdf.text(`Downloaded by ${downloadedBy.slice(0,80)} on ${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}`, 50, 794, { lineBreak: false });
      pdf.restore();
    }
    pdf.end();
  });
};
