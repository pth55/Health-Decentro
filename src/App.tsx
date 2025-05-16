import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { ProfileSetup } from "./pages/ProfileSetup";
import { Documents } from "./pages/Documents";
import { VitalsTracking } from "./pages/VitalsTracking";
import { DoctorAccessManagement } from "./pages/DoctorAccessManagement";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile-setup" element={<ProfileSetup />} />
          <Route path="documents" element={<Documents />} />
          <Route path="vitals" element={<VitalsTracking />} />
          <Route path="doctor-access" element={<DoctorAccessManagement />} />
        </Route>
      </Route>
    </>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
