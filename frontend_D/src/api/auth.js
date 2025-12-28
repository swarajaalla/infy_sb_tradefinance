import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const signupUser = async (data) => {
  return axios.post(`${API_URL}/auth/signup`, data);
};

export const loginUser = async (data) => {
  return axios.post(`${API_URL}/auth/login`, data);
};