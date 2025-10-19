// src/routes/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PATHS } from "./path";

// Importa las páginas con lazy loading
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const DashBoard = lazy(() => import("../pages/DashBoard"))
const Pay = lazy(() => import("../payments/Pay"));
const Inventory = lazy(() => import("../pages/Inventory"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Cargando...</div>}>
        <Routes>
          <Route path={PATHS.home} element={<Home />} />
          <Route path={PATHS.login} element={<Login />} />
          <Route path={PATHS.register} element={<Register />} />
          <Route path={PATHS.dashboard} element={<DashBoard/>}/>
          <Route path={PATHS.pay} element={<Pay/>}/>
          <Route path={PATHS.inventory} element={<Inventory/>}/>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
