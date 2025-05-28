import axios from 'axios';
import { supabase } from './supabaseClient';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});


export default axiosInstance; 