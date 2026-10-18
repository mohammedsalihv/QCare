export const workspaces = [
  { name: 'Measure & improve', description: 'Indicators, audits and improvement actions', links: [
    ['Indicators & submissions', 'kpi'], ['Clinical audits', 'audit'], ['Corrective actions', 'capa'], ['Change requests', 'change-management'], ['Deviations', 'deviations'], ['Reports', 'report-generator'], ['JAWDA · AOT', 'jawda/aot'], ['JAWDA · ASD', 'jawda/asd'], ['JAWDA · BN', 'jawda/bn'], ['JAWDA · DF', 'jawda/df'],
  ] },
  { name: 'Safety & experience', description: 'Report, investigate and learn', links: [
    ['Incidents', 'incidents'], ['Risk register', 'risks'], ['Patient experience', 'experience'], ['Infection prevention', 'ipc'], ['Medication safety', 'meds'], ['Facilities & safety', 'fms'],
  ] },
  { name: 'Assurance & evidence', description: 'Requirements, documents and readiness', links: [
    ['Compliance', 'compliance'], ['Evidence & documents', 'documents'], ['Training & competency', 'training'], ['Medical affairs', 'cp'], ['Clinical privileges', 'clinical-privileges'], ['Suppliers', 'supplier'], ['Equipment', 'equipment'],
  ] },
  { name: 'People & administration', description: 'Organization, access and configuration', admin: true, links: [
    ['People', 'users'], ['Departments', 'departments'], ['Contacts', 'contact-master'], ['Locations', 'location-types'], ['Specialties', 'speciality-master'], ['Designations', 'designation-master'], ['Credentials', 'mall-credential'], ['Physician directory', 'physician-demography'], ['Physician verification', 'physician-demography-verification'], ['Roles', 'application-roles'], ['Assignments', 'user-assignment'], ['Password management', 'password-management'], ['Activity history', 'audit-log'], ['Mail history', 'mail-log'], ['Settings', 'settings'],
  ] },
];
export const workspacePath = (slug) => `/dashboard/${slug}`;
const searchAliases = {
  kpi: 'kpi key performance indicator numerator denominator rate data submission',
  'key-performance-indicator': 'kpi key performance indicator management definition target',
  documents: 'evidence policy procedure document library',
  capa: 'capa corrective preventive action improvement',
  ipc: 'ipc infection prevention control',
};
export const normalizeToolSearch = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
export const matchesToolSearch = (query, label, slug, group = '') => {
  const words = normalizeToolSearch(query).split(/\s+/).filter(Boolean);
  const text = normalizeToolSearch(`${label} ${slug} ${group} ${searchAliases[slug] || ''}`);
  return words.length > 0 && words.every(word => text.includes(word));
};
export const availableWorkspaces = (role) => workspaces.filter(group => !group.admin || ['admin', 'superadmin'].includes(role?.toLowerCase()));
