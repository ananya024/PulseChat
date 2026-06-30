// messages.js

import api from "./axios";

export const getConversation = (username) => api.get(`/messages/${username}`);

export const getUnreadCounts = () => api.get("/messages/unread-counts");