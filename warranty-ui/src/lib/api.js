import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem('sessionUser');
    if (session) {
      const { token } = JSON.parse(session);
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;
  if (responseData?.validationErrors) {
    const firstValidationError = Object.values(responseData.validationErrors)[0];
    if (firstValidationError) {
      return firstValidationError;
    }
  }
  return responseData?.message || fallbackMessage;
}

