import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

export const register = async (userData) => {
  const res = await axios.post(API_URL, userData);
  return res.data;
};
