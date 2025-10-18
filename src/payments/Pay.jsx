// src/pages/Pay.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PATHS } from "../routes/path";

export default function Pay() {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const [banner, setBanner] = useState(null); // {type: 'success'|'error'|'info', text: string}

  const initialOptions = {
    "client-id": clientId,
    currency: "USD", // PayPal sandbox funciona perfecto en USD
    intent: "capture",
  };

  // helper para mostrar banner y redirigir (opcionalmente)
  const notify = (type, text, redirectTo, delayMs = 1500) => {
    setBanner({ type, text });
    if (redirectTo) {
      setTimeout(() => navigate(redirectTo), delayMs);
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      {/* Banner superior */}
      {banner && (
        <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-4">
          <div
            className={`max-w-xl w-full rounded-lg px-4 py-3 text-sm shadow ${
              banner.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : banner.type === "error"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-sky-100 text-sky-800 border border-sky-200"
            }`}
          >
            {banner.text}
          </div>
        </div>
      )}

      <div className="min-h-screen grid place-items-center p-8 bg-gray-50">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Pagar con PayPal</h1>

          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={(_, actions) =>
              actions.order.create({
                purchase_units: [
                  {
                    amount: { value: "10.00" }, // <-- cambia el monto si lo necesitas
                    description: "Suscripción inicial Atgest",
                  },
                ],
              })
            }
            onApprove={async (_, actions) => {
              try {
                const details = await actions.order.capture();
                // Si quieres, guarda el recibo para mostrarse luego
                sessionStorage.setItem("pp_last_payment", JSON.stringify(details));

                // ✅ Muestra banner y redirige a Login
                notify(
                  "success",
                  "Pago exitoso 🎉 Serás redirigido al inicio de sesión…",
                  PATHS.login,
                  3000
                );
              } catch (e) {
                console.error(e);
                notify("error", "Ocurrió un error al confirmar el pago.");
              }
            }}
            onCancel={() => {
              notify("info", "Pago cancelado por el usuario.");
            }}
            onError={(err) => {
              console.error("PayPal error:", err);
              notify("error", "Error en PayPal. Intenta nuevamente.");
            }}
          />
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
