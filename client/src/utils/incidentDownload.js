import axios from 'axios';
import { getAuthConfig } from './authConfig';
export async function incidentDownload(url, name, params) {
  try {
    const { data } = await axios.get(url, { ...getAuthConfig(), params, responseType: 'blob' });
    const href = URL.createObjectURL(data);
    const link = document.createElement('a'); link.href = href; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10000);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const value = await error.response.data.text();
      try { throw new Error(JSON.parse(value).message); } catch (parsed) { if (!(parsed instanceof SyntaxError)) throw parsed; }
    }
    throw new Error('Could not download the report. Please try again.');
  }
}
