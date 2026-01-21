import api from "../api/axios";

export const getIntegrityStatus = () =>
  api.get("/integrity/status");

export const runIntegrityCheck = () =>
  api.post("/integrity/run");
