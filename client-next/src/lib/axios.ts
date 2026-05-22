import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050",
  withCredentials: true, // sends HTTP-only cookie automatically
  headers: { "Content-Type": "application/json" },
});

export default api;
