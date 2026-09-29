import api from "./api";

export const complaintService = {
  async getMyComplaints() {
    return api.get("/complaints/my");
  },

  async getComplaintById(id) {
    return api.get(`/complaints/${id}`);
  },

  async createComplaint(payload) {
    return api.post("/complaints", payload);
  },

  async uploadImage(imageUri) {
    const formData = new FormData();
    const filename = imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename ?? "");
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("image", { uri: imageUri, name: filename, type });
    return api.postForm("/upload", formData);
  },
};

export default complaintService;
