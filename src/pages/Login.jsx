// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost, apiGet } from "../lib/api";
import { PATHS } from "../routes/path";

export default function Login() {
  const navigate = useNavigate(); 
  const [form, setForm] = useState({
    identifier: "", 
    password: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.identifier.trim()) return "Usuario o email es obligatorio.";
    if (form.password.length < 1) return "Ingresa tu contraseña.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");
    const v = validate();
    if (v) return setErrMsg(v);

    setLoading(true);
    try {
      const resp = await apiPost("/auth/login/", form);
      localStorage.setItem("access", resp.access);
      localStorage.setItem("refresh", resp.refresh);

      // Verificamos el usuario
      const me = await apiGet("/auth/me/");
      setOkMsg(`¡Bienvenido, ${me.username}!`);

      // Espera un momento para mostrar mensaje (opcional)
      setTimeout(() => {
        navigate(PATHS.dashboard); //  Redirige al Dashboard.jsx
      }, 800);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        setErrMsg(parsed?.detail || "Credenciales inválidas.");
      } catch {
        setErrMsg("Error al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Lado izquierdo: branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-blue-500 items-center justify-center p-12">
        <div className="text-white text-center space-y-6 max-w-lg">
          <div className="mx-auto h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
            A
          </div>
          <h1 className="text-5xl font-extrabold tracking-wide">Atgest</h1>
          <p className="text-lg opacity-90">
            Inicia sesión para gestionar tus servicios.
          </p>
          <div className="mx-auto h-64 w-full rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white/80">Imagen / Ilustración (placeholder)</span>
          </div>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 md:p-16">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              A
            </div>
            <span className="text-xl font-bold text-gray-900">Atgest</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Iniciar sesión
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Accede a tu cuenta de Atgest.
          </p>

          {okMsg && (
            <div className="mb-4 p-3 rounded bg-green-100 text-green-800 text-sm text-center">
              {okMsg}
            </div>
          )}
          {errMsg && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm text-center">
              {errMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Usuario o Email
              </label>
              <input
                id="identifier"
                name="identifier"
                value={form.identifier}
                onChange={onChange}
                placeholder="tu usuario o tu@correo.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="********"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-pressed={showPwd}
                  title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-2 my-auto p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {showPwd ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.585 10.585A3 3 0 0012 15a3 3 0 001.414-.385M9.88 4.49A9.98 9.98 0 0121 12c-1.2 2.4-3.6 4.8-9 4.8-1.49 0-2.79-.2-3.9-.57M4.12 7.51A9.98 9.98 0 003 12c1.2 2.4 3.6 4.8 9 4.8.7 0 1.37-.05 2-.14" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <div className="mt-6 flex flex-col items-center space-y-2">
              <Link
                to={PATHS.register}
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                Crear una cuenta
              </Link>
              <button
                type="button"
                className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-100"
              >
                Recuperar contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
