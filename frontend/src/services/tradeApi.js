import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

export const createTrade = (data) =>
  axios.post(`${API_URL}/trades/`, data, authHeader());

export const listTrades = () =>
  axios.get(`${API_URL}/trades/`, authHeader());

export const updateTradeStatus = (tradeId, status) =>
  axios.put(
    `${API_URL}/trades/${tradeId}/status`,
    { status },
    authHeader()
  );

export const assignBankToTrade = (tradeId, bankId) =>
  axios.post(
    `${API_URL}/trades/${tradeId}/assign-bank`,
    { bank_id: bankId },
    authHeader()
  );

export const getTradeById = (tradeId) =>
  axios.get(`${API_URL}/trades/${tradeId}`, authHeader());
