// src/pages/HomeLanding.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { PATHS } from "../routes/path";
import logo from "../assets/logo_.webp";

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-emerald-500/60 bg-white">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path
            d="M20 7L9 18l-5-5"
            strokeWidth="3"
            stroke="currentColor"
            className="text-emerald-600"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-slate-700">{children}</span>
    </li>
  );
}

function PhoneCard({ title, line1, line2 }) {
  return (
    <div className="w-52 sm:w-56 rounded-3xl border bg-white/90 shadow-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <img src={logo} alt="AtGest logo" className="h-7 w-7 object-contain rounded-md" />
        <div className="font-semibold text-slate-800">{title}</div>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 border">{line1}</div>
      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 border">{line2}</div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-lg bg-slate-100 p-2 text-center">Servicio</div>
        <div className="rounded-lg bg-slate-100 p-2 text-center">Costo</div>
        <div className="rounded-lg bg-slate-100 p-2 text-center">Estado</div>
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Inicio</span>
        <span>Servicios</span>
        <span>Perfil</span>
      </div>
    </div>
  );
}

export default function HomeLanding() {
  const [sending, setSending] = useState(false);
  const [sent,   setSent]   = useState(false);

  async function submitLead(e) {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    setSent(true);
    e.currentTarget.reset();
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2">
            <img src={logo} alt="AtGest logo" className="h-7 w-7 object-contain rounded-md" />
            <span className="font-bold tracking-tight">AtGest</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
            <a href="#beneficios" className="hover:text-slate-900">Automotoras</a>
            <a href="#planes" className="hover:text-slate-900">Planes</a>
            <a href="#form" className="hover:text-slate-900">Contacto</a>
            <a href="#soporte" className="hover:text-slate-900">Ayuda</a>
          </nav>

          {/* Botones de acción: preparados para React Router */}
          <div className="flex items-center gap-3">
            <Link
              to={PATHS.login}
              className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-95"
            >
              Ingresar
            </Link>
            <Link
              to={PATHS.register}
              className="rounded-full border border-slate-300 text-slate-700 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Registrar
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(14,165,233,0.15),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.15),transparent_40%)]" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm text-slate-500 font-medium">Inicio ▸ Automotoras</div>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight">
              Software de gestión para <span className="text-slate-900">talleres automotrices</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-7">
              Aumenta la rentabilidad centralizando y administrando todos los servicios de tu taller
              en una sola plataforma digital.
            </p>
            <ul className="mt-6 space-y-3">
              <CheckItem>Financiamiento y simulaciones.</CheckItem>
              <CheckItem>Transferencia de dominio digital.</CheckItem>
              <CheckItem>Seguro automotriz y más servicios integrados.</CheckItem>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#form"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-5 py-3 text-sm font-semibold shadow hover:opacity-95"
              >
                Me interesa
              </a>
              <a
                href="#beneficios"
                className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold"
              >
                Ir al software
              </a>
            </div>
          </div>

          {/* Mock de tarjetas */}
          <div className="relative mx-auto grid place-items-center">
            <div className="relative h-[420px] sm:h-[460px] w-full max-w-md">
              <div className="absolute left-2 top-8 rotate-[-18deg] drop-shadow-2xl">
                <PhoneCard title="AtGest" line1="Informe vehicular" line2="Historial de servicios" />
              </div>
              <div className="absolute right-0 top-0 rotate-[12deg] drop-shadow-2xl">
                <PhoneCard title="AtGest" line1="Crédito automotriz" line2="Cálculo automático" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 rotate-[2deg] drop-shadow-2xl">
                <PhoneCard title="AtGest" line1="Servicios" line2="Pagos y comisiones" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="beneficios" className="py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-[28px] bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-6 sm:p-10 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">¿Por qué usar nuestra plataforma?</h2>
                <ul className="mt-6 space-y-4 text-white/95">
                  <CheckItem>Ahorras tiempo gestionando tus servicios de manera autónoma.</CheckItem>
                  <CheckItem>Paga servicios mediante billetera digital.</CheckItem>
                  <CheckItem>Haz seguimiento a clientes y órdenes.</CheckItem>
                  <CheckItem>Controla comisiones y márgenes del negocio.</CheckItem>
                </ul>
              </div>
              <div className="relative">
                <div className="mx-auto w-full max-w-lg rounded-2xl bg-white/90 border p-4 shadow-lg">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <div className="mb-3 h-3 w-24 rounded bg-slate-200" />
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="h-20 rounded-lg bg-slate-100" />
                      <div className="h-20 rounded-lg bg-slate-100" />
                      <div className="h-20 rounded-lg bg-slate-100" />
                      <div className="h-20 rounded-lg bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4">
          <h3 className="text-3xl font-extrabold tracking-tight">Añade un plus a tu proceso</h3>
          <p className="mt-2 text-slate-600">Sin cambiar tus planes actuales.</p>
          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
              <div className="text-xl font-bold">Starter</div>
              <div className="mt-1 text-3xl font-extrabold">Sin costo</div>
              <p className="mt-1 text-slate-600">Inicia con lo básico para operar y administrar tu negocio.</p>
              <ul className="mt-6 space-y-3">
                <CheckItem>Gestión de servicios integrados (créditos, seguros, trámites).</CheckItem>
                <CheckItem>Notificaciones y seguimiento de leads.</CheckItem>
                <CheckItem>Simulaciones rápidas por WhatsApp.</CheckItem>
                <CheckItem>Transferencia de dominio digital.</CheckItem>
                <CheckItem>Pagos con tarjeta y conciliación simple.</CheckItem>
              </ul>
              <button className="mt-6 rounded-full border px-4 py-2">Más información</button>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm p-6 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-xs rounded-full bg-cyan-100 px-2 py-1 text-cyan-700">
                Próximamente
              </div>
              <div className="text-xl font-bold">Growth</div>
              <div className="mt-1 text-3xl font-extrabold">6 UF</div>
              <p className="mt-1 text-slate-600">Todo lo del plan Starter + servicios premium.</p>
              <ul className="mt-6 space-y-3">
                <CheckItem>Integración con CRM y perfiles de usuario.</CheckItem>
                <CheckItem>Reportes avanzados de ventas y comisiones.</CheckItem>
                <CheckItem>Publicidad y sitio web personalizado.</CheckItem>
                <CheckItem>Clientes con crédito preaprobado.</CheckItem>
              </ul>
              <button className="mt-6 rounded-full border px-4 py-2">Más información</button>
            </div>
          </div>
        </div>
      </section>

      {/* SOPORTE */}
      <section id="soporte" className="py-16">
        <div className="mx-auto max-w-7xl px-4 rounded-3xl bg-gradient-to-r from-cyan-600 to-sky-600 text-white p-8">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <h3 className="text-3xl font-extrabold tracking-tight">¿Necesitas ayuda?</h3>
              <p className="mt-2 text-white/90">
                Horario de atención telefónica: Lunes a Viernes 09:00–18:30, Sábados 10:00–14:00.
              </p>
              <div className="mt-6 space-y-2 text-white/95">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/20 inline-block" /> Teléfono: +56 9 1234 5678
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/20 inline-block" /> contacto@taller.cl
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/20 inline-block" /> Escríbenos por WhatsApp
                </div>
              </div>
            </div>
            <div className="aspect-[16/10] rounded-2xl bg-white/10 border border-white/30" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-sky-500 to-cyan-400" />
              <div className="font-bold">AtGest</div>
            </div>
            <p className="mt-3 text-sm text-slate-400">Av. Ejemplo 1234, Santiago, Región Metropolitana</p>
          </div>
          <div>
            <div className="font-semibold">Servicios</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Informe historial</li>
              <li>Inspección mecánica</li>
              <li>Pago seguro</li>
              <li>Transferencia digital</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Automotoras</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Soluciones</li>
              <li>Ir al software</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Ayuda</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Preguntas frecuentes</li>
              <li>Contacto</li>
              <li>Términos y condiciones</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-400">
            © {new Date().getFullYear()} AtGest. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
