export const getAuthConfig = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return {};
  const { token } = JSON.parse(userInfo);
  return { headers: { Authorization: `Bearer ${token}` } };
};
