// auth.js

import api from "./axios";

export const loginUser= (formData)=> api.post("auth/login", formData);