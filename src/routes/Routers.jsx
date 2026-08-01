import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Contact from "@/pages/Contact";
import DoctorsDetails from "@/pages/Doctors/DoctorsDetails";
import MyAccount from "@/dashboard/user-account/MyAccount";
import Dashboard from "@/dashboard/doctor-account/Dashboard";
import { Routes, Route } from "react-router-dom";
import Doctors from "@/pages/Doctors/Doctors";
import ProtectedRoute from "./ProtectedRoute";
import CheckoutSuccess from "@/pages/Doctors/CheckoutSuccess";

function Routers() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorsDetails />} />
      <Route path="/services" element={<Services />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/checkout-success" element={<CheckoutSuccess />} />

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
    </Routes>
  );
}

export default Routers;
