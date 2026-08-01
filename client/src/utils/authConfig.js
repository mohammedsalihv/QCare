export const getAuthConfig = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return {};
  const parsed = JSON.parse(userInfo);
  const token = parsed?.token;
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};
