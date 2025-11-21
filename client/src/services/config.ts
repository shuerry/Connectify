import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import logger from '../utils/logger';

/**
 * Function to handle successful responses
 */
const handleRes = (res: AxiosResponse) => res;

/**
 * Function to handle errors
 */
const handleErr = (err: AxiosError) => {
  logger.error(err);
  return Promise.reject(err);
};

// Use Vite environment variable when available to point to the API server.
// If not set, relative requests will be sent to the same origin as the client.
const BASE_URL = (import.meta as ImportMeta).env?.VITE_SERVER_URL || '';
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

/**
 * Add a request interceptor to the Axios instance.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error: AxiosError) => handleErr(error),
);

/**
 * Add a response interceptor to the Axios instance.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => handleRes(response),
  (error: AxiosError) => handleErr(error),
);

export default api;
