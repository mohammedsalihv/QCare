import { invalidateMasterData, masterSources } from './utils/masterData';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import './design-system.css'

// Route all relative API requests through the current origin (using Nginx proxy)
axios.defaults.baseURL = window.location.origin;

// Intercept all absolute backend calls to port 5000 and rewrite them to route securely through the current origin
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://192.168.1.160:5000')) {
    config.url = config.url.replace('http://192.168.1.160:5000', window.location.origin);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Refresh mounted selectors after a successful master mutation.
axios.interceptors.response.use(response => {
  if (['post', 'put', 'patch', 'delete'].includes(response.config.method?.toLowerCase())) {
    const path = new URL(response.config.url, window.location.origin).pathname;
    if (Object.values(masterSources).some(source => path === source.url || path.startsWith(source.url + '/'))) invalidateMasterData();
  }
  return response;
});

// Sync token from userInfo if it's missing in localStorage (active session migration)
const userInfo = localStorage.getItem('userInfo');
if (userInfo && !localStorage.getItem('token')) {
  try {
    const parsed = JSON.parse(userInfo);
    if (parsed && parsed.token) {
      localStorage.setItem('token', parsed.token);
    }
  } catch (e) {
    console.error('Failed to sync token from userInfo', e);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
