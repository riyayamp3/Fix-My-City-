import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Authority pages
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import Jobs from "./pages/Jobs";
import MapDashboard from "./pages/MapDashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";

// Contractor pages
import ContractorLogin from "./pages/contractor/Login";
import ContractorSignup from "./pages/contractor/Signup";
import ContractorDashboard from "./pages/contractor/Dashboard";
import ContractorJobs from "./pages/contractor/Jobs";
import ContractorBids from "./pages/contractor/Bids";
import ContractorMyJobs from "./pages/contractor/MyJobs";
import ContractorProfile from "./pages/contractor/Profile";
import ContractorLayout from "./components/contractor/ContractorLayout";
import ContractorProtectedRoute from "./components/contractor/ContractorProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ── Landing ── */}
          <Route path="/" element={<Landing />} />

          {/* ── Authority auth ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Authority portal (protected) ── */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapDashboard /></ProtectedRoute>} />

          {/* ── Contractor auth ── */}
          <Route path="/contractor/login" element={<ContractorLogin />} />
          <Route path="/contractor/signup" element={<ContractorSignup />} />

          {/* ── Contractor portal (protected) ── */}
          <Route path="/contractor/app/" element={
            <ContractorProtectedRoute>
              <ContractorLayout><ContractorDashboard /></ContractorLayout>
            </ContractorProtectedRoute>
          } />
          <Route path="/contractor/app/jobs" element={
            <ContractorProtectedRoute>
              <ContractorLayout><ContractorJobs /></ContractorLayout>
            </ContractorProtectedRoute>
          } />
          <Route path="/contractor/app/bids" element={
            <ContractorProtectedRoute>
              <ContractorLayout><ContractorBids /></ContractorLayout>
            </ContractorProtectedRoute>
          } />
          <Route path="/contractor/app/my-jobs" element={
            <ContractorProtectedRoute>
              <ContractorLayout><ContractorMyJobs /></ContractorLayout>
            </ContractorProtectedRoute>
          } />
          <Route path="/contractor/app/profile" element={
            <ContractorProtectedRoute>
              <ContractorLayout><ContractorProfile /></ContractorLayout>
            </ContractorProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
