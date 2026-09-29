import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole = "ADMIN" }: Props) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
