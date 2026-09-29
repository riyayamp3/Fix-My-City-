import { Navigate } from "react-router-dom";

export default function ContractorProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) return <Navigate to="/contractor/login" replace />;
  if (role !== "CONTRACTOR") {
    localStorage.clear();
    return <Navigate to="/contractor/login" replace />;
  }
  return <>{children}</>;
}
