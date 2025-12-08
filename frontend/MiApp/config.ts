// IP base que solo cambias UNA VEZ
const BASE_IP = 'http://192.168.0.8';

// Servicios
export const API_MAIN = `${BASE_IP}:3000`;
export const API_CHAT = `${BASE_IP}:8000/chat`;
export const API_ANALYTICS = `${BASE_IP}:8001/analytics`;

export default {
  API_MAIN,
  API_CHAT,
  API_ANALYTICS,
};
