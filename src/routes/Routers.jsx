import { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ProtectedRoute from "./ProtectedRoute";
import Spinner from "@/components/ui/spinner";

// every page except Home is its own file, downloaded the first time it's opened,
// so the first visit only loads the home page instead of the whole site
const loadDoctors = () => import("@/pages/Doctors/Doctors");
const loadDoctorsDetails = () => import("@/pages/Doctors/DoctorsDetails");
const loadLogin = () => import("@/pages/Login");

const Doctors = lazy(loadDoctors);
const DoctorsDetails = lazy(loadDoctorsDetails);
const Login = lazy(loadLogin);
const Services = lazy(() => import("@/pages/Services"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Contact = lazy(() => import("@/pages/Contact"));
const CheckoutSuccess = lazy(() => import("@/pages/Doctors/CheckoutSuccess"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const MyAccount = lazy(() => import("@/dashboard/user-account/MyAccount"));
const Dashboard = lazy(() => import("@/dashboard/doctor-account/Dashboard"));
const AdminDashboard = lazy(() => import("@/dashboard/admin/AdminDashboard"));
const VideoConsultation = lazy(() => import("@/pages/VideoConsultation"));
const Messages = lazy(() => import("@/pages/Messages"));
const PrescriptionView = lazy(() => import("@/pages/PrescriptionView"));
const SymptomChecker = lazy(() => import("@/pages/SymptomChecker"));
const VerifyEmail = lazy(() => import("@/pages/EmailFlows").then(module => ({ default: module.VerifyEmail })));
const CheckEmail = lazy(() => import("@/pages/EmailFlows").then(module => ({ default: module.CheckEmail })));

const PageLoading = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <Spinner className="h-8 w-8" />
  </div>
);

// location is passed in by Layout so the old page stays rendered during its exit animation
function Routers({ location }) {
  // once the browser is idle, fetch the pages most visitors open next so they appear instantly
  useEffect(() => {
    const preload = () => [loadDoctors, loadDoctorsDetails, loadLogin].forEach(load => load().catch(() => {}));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(preload, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={<PageLoading />}>
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorsDetails />} />
      <Route path="/services" element={<Services />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/checkout-success" element={<CheckoutSuccess />} />
      {/* open to everyone: the page itself asks visitors to log in */}
      <Route path="/symptom-checker" element={<SymptomChecker />} />

      <Route
        path="/users/profile/me"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <MyAccount />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors/profile/me"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultation/:bookingId"
        element={
          <ProtectedRoute allowedRoles={["patient", "doctor"]}>
            <VideoConsultation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:conversationId?"
        element={
          <ProtectedRoute allowedRoles={["patient", "doctor"]}>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/:bookingId"
        element={
          <ProtectedRoute allowedRoles={["patient", "doctor"]}>
            <PrescriptionView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default Routers;
