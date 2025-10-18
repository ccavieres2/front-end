// src/MyCheckoutComponent.jsx
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function MyCheckoutComponent() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const createOrder = (data, actions) =>
    actions.order.create({
      purchase_units: [{ description: "Compra de prueba", amount: { value: "10.99" } }],
    });

  const onApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      sessionStorage.setItem("pp_last_payment", JSON.stringify(details));
      const amount = details?.purchase_units?.[0]?.amount?.value || "0.00";
      navigate(`/payment-result?status=success&orderId=${details?.id}&amount=${amount}`);
    } catch (e) {
      console.error(e);
      setError("No se pudo capturar el pago.");
      navigate("/payment-result?status=error");
    }
  };

  return (
    <div>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={() => navigate("/payment-result?status=cancel")}
        onError={(err) => {
          console.error(err);
          setError("Ocurrió un error con PayPal.");
          navigate("/payment-result?status=error");
        }}
      />
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
