import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export const authService = {
  async login(username, password) {
    const data = await api.post("/auth/login", { username, password });
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("role", data.role);
    await AsyncStorage.setItem("userId", data.userId);
    return data;
  },

  async signup(username, password) {
    // Citizens always register with role CITIZEN
    const data = await api.post("/auth/signup", { username, password, role: "CITIZEN" });
    return data;
  },

  async logout() {
    await AsyncStorage.multiRemove(["token", "role", "userId"]);
  },

  async getToken() {
    return AsyncStorage.getItem("token");
  },

  async getUserId() {
    return AsyncStorage.getItem("userId");
  },

  async isLoggedIn() {
    const token = await AsyncStorage.getItem("token");
    return !!token;
  },
};

export default authService;
