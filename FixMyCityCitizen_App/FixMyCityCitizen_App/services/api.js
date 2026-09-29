import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Change this to your machine's local IP when testing on a physical device
// e.g. "http://192.168.1.100:5000/api"
const BASE_URL = "http://10.144.86.205:5000/api";

async function getHeaders(isMultipart = false) {
  const token = await AsyncStorage.getItem("token");
  const headers = {};
  if (!isMultipart) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request(method, path, body = null, isMultipart = false) {
  const headers = await getHeaders(isMultipart);
  const options = { method, headers };
  if (body) options.body = isMultipart ? body : JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (res.status === 401) {
    // Token expired or invalid — clear storage and redirect to login
    await AsyncStorage.multiRemove(["token", "role", "userId"]);
    router.replace("/login");
    throw { status: 401, message: "Session expired. Please log in again." };
  }

  if (!res.ok) {
    throw { status: res.status, message: data.error || "Request failed" };
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  postForm: (path, formData) => request("POST", path, formData, true),
  rewards: {
    getMe: () => request("GET", "/rewards/me"),
    getLeaderboard: () => request("GET", "/rewards/leaderboard"),
    upvote: (complaintId) => request("POST", `/rewards/upvote/${complaintId}`),
    redeem: (body) => request("POST", "/rewards/redeem", body),
  },
};

export default api;
