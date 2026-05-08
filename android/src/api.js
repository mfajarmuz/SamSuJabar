// src/api.js
import axios from 'axios';
import API_URL from './config';

const client = axios.create({ baseURL: API_URL, timeout: 30000 });

export async function uploadFiles(files) {
  const form = new FormData();
  files.forEach(f => {
    form.append('files', {
      uri: f.uri,
      name: f.name,
      type: 'application/pdf',
    });
  });
  const res = await client.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getLaporan(laporan_id) {
  const res = await client.get(`/api/laporan/${laporan_id}`);
  return res.data;
}

export async function getLaporanList() {
  const res = await client.get('/api/laporan');
  return res.data;
}
