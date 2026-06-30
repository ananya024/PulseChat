// axios.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => { //its like teh auth guard in nest
    // wil be used for all gets and posts after login
  const token = localStorage.getItem("token");

  // console.log("token:::: ",token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // console.log("header: ", config.headers);

  return config;
});

export default api;