import axios from 'axios';

const isDevelopment = import.meta.env.DEV;
const baseURL = import.meta.env.VITE_API_URL || (isDevelopment ? 'http://localhost:3000/api' : '/api');

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
