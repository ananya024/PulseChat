// users.js

import api from "./axios";

export const getAllUsers = () => api.get("/users");
export const getUser = (username) => api.get(`/users/${username}`);
export const getProfile = () => api.get("/auth/profile");