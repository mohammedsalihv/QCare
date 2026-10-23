import axios from 'axios';
import { getAuthConfig } from './authConfig';

export const masterSources = {
  privileges: { url: '/api/cp/privileges', labelKey: 'specialty' },
  credentials: { url: '/api/cp/credentials', labelKey: 'documentNumber' },
  accounts: { url: '/api/users', labelKey: 'employeeName' },
  users: { url: '/api/users/directory', labelKey: 'employeeName' },
  departments: { url: '/api/departments', labelKey: 'name' },
  designations: { url: '/api/designations', labelKey: 'title' },
  locations: { url: '/api/locations', labelKey: 'name' },
  specialties: { url: '/api/masters/specialties', labelKey: 'name' },
  procedureCategories: { url: '/api/masters/procedure-categories', labelKey: 'name' },
  procedures: { url: '/api/masters/procedures', labelKey: 'name' },
  physicianProfiles: { url: '/api/masters/physician-profiles', labelKey: 'name' },
};
export function isActiveRecord(record) {
  return record.isActive !== false && !['inactive', 'blocked', 'deleted'].includes(String(record.status || '').toLowerCase());
}
export async function fetchMasterData(resource, signal) {
  const source = masterSources[resource];
  if (!source) throw new Error(`Unknown master: ${resource}`);
  const { data } = await axios.get(source.url, { ...getAuthConfig(), signal });
  if (!Array.isArray(data)) throw new Error('Invalid master list response');
  return data;
}
export function invalidateMasterData(resource) {
  window.dispatchEvent(new CustomEvent('qcare:master-changed', { detail: resource }));
}
export async function saveMasterRecord(resource, values, id) {
  const url = masterSources[resource].url;
  const { data } = id ? await axios.put(`${url}/${id}`, values, getAuthConfig()) : await axios.post(url, values, getAuthConfig());
  invalidateMasterData(resource);
  return data;
}
export async function deleteMasterRecord(resource, id) {
  await axios.delete(`${masterSources[resource].url}/${id}`, getAuthConfig());
  invalidateMasterData(resource);
}
