import axios from 'axios';

const activeUsers = data => {
  if (!Array.isArray(data)) throw new Error('The connected server did not return a staff list. Check that its staff-directory update is deployed.');
  return data.filter(user => user.isActive !== false && !['inactive', 'blocked'].includes(String(user.status || '').toLowerCase()))
    .map(({ _id, employeeId, employeeName, department, designation, status, isActive }) => ({ _id, employeeId, employeeName, department, designation, status, isActive }))
    .sort((a, b) => String(a.employeeName || '').localeCompare(String(b.employeeName || '')));
};

// Older live servers provide only the administrator users endpoint.
// The server still enforces permissions; never retry authentication failures there.
export async function loadUserDirectory(config, role) {
  try {
    const { data } = await axios.get('/api/users/directory', config);
    return activeUsers(data);
  } catch (error) {
    if (error.response?.status !== 404 || config?.signal?.aborted) throw error;
    if (!['admin', 'superadmin'].includes(String(role || '').toLowerCase())) {
      throw new Error('The connected server needs the staff-directory update before this list can load. Contact your administrator.');
    }
    const { data } = await axios.get('/api/users', config);
    return activeUsers(data);
  }
}

export function directoryErrorMessage(error) {
  const status = error.response?.status;
  if (status === 401) return 'Your session could not be verified. Sign in again to load staff.';
  if (status === 403) return error.response?.data?.message || 'Your account does not have permission to load staff on the connected server.';
  if (status === 404) return 'The connected server needs the staff-directory update before this list can load.';
  return error.response?.data?.message || error.message || 'Could not connect to the staff list. Try again.';
}
