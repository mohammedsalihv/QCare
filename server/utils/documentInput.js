const types = ['Policy', 'Procedure', 'Guideline', 'Manual', 'Form', 'Certificate', 'Evidence'];
function input(body) {
  const text = (key, max, required = true) => {
    const value = body[key];
    if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw Error(`Enter a valid ${key} (up to ${max} characters).`);
    return value.trim();
  };
  const date = (key, optional = false) => {
    const value = body[key];
    if (optional && !value) return undefined;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw Error(`Choose a valid ${key}.`);
    return new Date(value);
  };
  const result = { name: text('name', 200), type: text('type', 40), department: text('department', 150), ref: text('ref', 100), description: text('description', 4000, false), changeSummary: text('changeSummary', 2000), classification: text('classification', 30), audience: text('audience', 40), revisedDate: date('revisedDate'), nextRevDate: date('nextRevDate'), expiryDate: date('expiryDate', true), allowDownload: body.allowDownload === true || body.allowDownload === 'true' };
  if (!types.includes(result.type) || !['Public', 'Restricted', 'Confidential', 'Secret'].includes(result.classification) || !['All staff', 'Department', 'Owner and reviewers'].includes(result.audience)) throw Error('Choose a valid document type, classification and audience.');
  if (result.classification === 'Public') result.audience = 'All staff';
  if (['Confidential', 'Secret'].includes(result.classification) && result.audience !== 'Owner and reviewers') throw Error('Confidential documents are limited to their owner and reviewers.');
  if (result.nextRevDate <= result.revisedDate || (result.expiryDate && result.expiryDate <= result.revisedDate)) throw Error('Review and expiry dates must be after the effective date.');
  if (body.source === 'template') result.generatedText = text('generatedText', 8000);
  return result;
}
function fileInput(file) {
  if (!file) throw Error('Attach a document.');
  const b = file.buffer, ext = require('path').extname(file.originalname).toLowerCase();
  const mime = ext === '.pdf' && b.subarray(0,5).toString() === '%PDF-' ? 'application/pdf'
    : ext === '.png' && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
    : ['.jpg','.jpeg'].includes(ext) && b[0] === 255 && b[1] === 216 && b[2] === 255 ? 'image/jpeg'
    : ext === '.csv' && !b.includes(0) && !/<\s*(html|script|svg)\b/i.test(b.toString('utf8')) ? 'text/csv' : '';
  if (!mime || !b.length || b.length > 10 * 1024 * 1024) throw Error('Use PDF, PNG, JPG or CSV, up to 10 MB.');
  return { name: file.originalname.replace(/[\x00-\x1f/\\]/g, '_').slice(0,180), mime, data: b };
}
module.exports = { input, fileInput, types };
