import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8001",
  timeout: 30000,
});

// ── Auth ──────────────────────────────────────────────
export const login = (username, password) =>
  api.post("/api/v2/auth/login", { username, password });

export const changePassword = (username, old_password, new_password) =>
  api.post("/api/v2/auth/change-password", { username, old_password, new_password });

// ── Dashboard & Lịch sử ───────────────────────────────
export const getDashboardStats = () => api.get("/api/v2/data/dashboard-stats");
export const getAllResults = (userId, batchId) => {
  const params = { batch_id: batchId };
  if (userId) params.user_id = userId;
  return api.get("/api/v2/data/all-results", { params });
};
export const getBatches = () => api.get("/api/v2/data/batches");

// ── Sinh viên ─────────────────────────────────────────
export const getAllStudents = () => api.get("/api/v2/student/all");
export const getStudent = (mssv) => api.get(`/api/v2/student/${mssv}`);
export const addStudent = (data) => api.post("/api/v2/student/add", data);
export const deleteStudent = (mssv) => api.delete(`/api/v2/student/delete/${mssv}`);

// ── Tài khoản ─────────────────────────────────────────
export const getAllAccounts = () => api.get("/api/v2/account/all");
export const addAccount = (data) => api.post("/api/v2/account/add", data);
export const updateAccount = (id, data) => api.put(`/api/v2/account/update/${id}`, data);
export const deleteAccount = (id) => api.delete(`/api/v2/account/delete/${id}`);

// ── Upload & Dự báo ───────────────────────────────────
export const uploadPredict = (file, userId, tenDot) => {
  const formData = new FormData();
  formData.append("file", file);
  const params = new URLSearchParams();
  if (userId) params.append("user_id", userId);
  if (tenDot) params.append("ten_dot", tenDot);
  return api.post(`/api/v2/upload-predict?${params.toString()}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 180000, // 3 phút cho upload + AI call
  });
};

// ── Dự báo lại (sinh viên) ────────────────────────────
export const repredictStudent = (mssv, data) =>
  api.post(`/api/v2/repredict/${mssv}`, data);

// ── Lộ trình học tập ──────────────────────────────────
export const getLearningPath = (mssv) =>
  api.get(`/api/v2/learning-path/${mssv}`);

export const updatePathStatus = (pathId, status) =>
  api.put(`/api/v2/learning-path/${pathId}/status`, { status });

export const getSavedAIRoadmap = (mssv) =>
  api.get(`/api/v2/ai-roadmap/${mssv}`);

export const getAllMonHoc = () =>
  api.get("/api/v2/monhoc");

export const getAIRoadmap = (mssv, nganh, mon, ly_do_rot) => {
  return api.post("/api/v2/generate-ai-roadmap", {
    mssv: mssv,
    nganh: nganh,
    mon: mon,
    ly_do_rot: ly_do_rot
  }, { timeout: 120000 });
};

// ── Bài tập & Test ────────────────────────────────────
export const getExercises = (mssv) =>
  api.get(`/api/v2/exercises/${mssv}`);

export const submitAnswer = (exerciseId, mssv, chosenIndex) =>
  api.post("/api/v2/exercises/submit", {
    exercise_id: exerciseId,
    mssv,
    chosen_index: chosenIndex,
  });

export const generateAIQuiz = (mssv, mon_hoc, ly_do) =>
  api.post("/api/v2/generate-ai-quiz", { mssv, mon_hoc, ly_do }, { timeout: 120000 });

// ── Khảo sát Tâm lý (New) ─────────────────────────────
export const getTamLyRandom = (mssv) =>
  api.get(`/api/v2/tam-ly/random/${mssv}`);

export const submitTamLy = (mssv, answers) =>
  api.post("/api/v2/tam-ly/submit", { mssv, answers });

export const getTamLyStats = (mssv) =>
  api.get(`/api/v2/tam-ly/stats/${mssv}`);


// ── Tiến bộ & So sánh ─────────────────────────────────
export const getProgress = (mssv) =>
  api.get(`/api/v2/progress/${mssv}`);

export const getExerciseHistory = (mssv) =>
  api.get(`/api/v2/exercises/history/${mssv}`);

// ── Khoa & Lớp (dùng cho form thêm sinh viên) ──────────────────────────
export const generateAdvice = () => Promise.resolve({ data: { advice: "" } });
export const getKhoaList = () => api.get("/api/v2/student/khoa-list");
export const getAssignData = (maKhoa) => api.get(`/api/v2/student/assign-data/${maKhoa}`);

export default api;
