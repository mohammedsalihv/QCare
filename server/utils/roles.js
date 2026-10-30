const ROLES = ['SuperAdmin', 'admin', 'QualityManager', 'QualityOfficer', 'user'];
const normalizeRole = value => ({superadmin:'SuperAdmin',admin:'admin',quality:'QualityManager',qualitymanager:'QualityManager',qualityofficer:'QualityOfficer',user:'user',staff:'user'})[String(value || '').replace(/\s/g,'').toLowerCase()] || value;
module.exports = { ROLES, normalizeRole };
