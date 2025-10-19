import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo_.webp";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

/* UI helpers */
function IconButton({ title, onClick, children, className = "" }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 ${className}`}>
      {children}
    </button>
  );
}
function PrimaryButton({ title, onClick, children }) {
  return (
    <button type="button" title={title} onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700">
      {children}
    </button>
  );
}
function Modal({ open, title, onClose, onSubmit, children, submitText = "Guardar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" title="Cerrar">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Cancelar</button>
          <button onClick={onSubmit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Estado (API <-> UI) */
const STATUS = {
  pending: "Pendiente",
  in_progress: "En curso",
  done: "Completado",
};
const STATUS_FROM_LABEL = {
  "Pendiente": "pending",
  "En curso": "in_progress",
  "Completado": "done",
};

/* Opciones combustible (ajustables según tu backend) */
const FUEL_OPTIONS = [
  { value: "", label: "No especificado" },
  { value: "gasoline", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electric", label: "Eléctrico" },
  { value: "hybrid", label: "Híbrido" },
];

// Componente de Input reutilizable para el formulario
function FormInput({ id, label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        id={id}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder || label}
        className="rounded-lg border px-3 py-2 text-sm"
      />
    </div>
  );
}

export default function DashBoard() {
  const [orders, setOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [form, setForm] = useState({});

  async function loadOrders() {
    setLoadingList(true);
    try {
      const data = await apiGet("/orders/");
      setOrders(data);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar las órdenes.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter(o =>
      (o.client_name || "").toLowerCase().includes(s) ||
      (o.vehicle_plate || "").toLowerCase().includes(s) ||
      (o.vehicle_brand || "").toLowerCase().includes(s) ||
      (o.order_number || "").toLowerCase().includes(s)
    );
  }, [q, orders]);

  // Handler genérico para actualizar el formulario
  function handleFormChange(e) {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  }

  function openAdd() {
    setEditing(null);
    setErrMsg("");
    setForm({
      status: "pending",
      entry_date: "",
      promised_date: "",
      service_advisor: "",
      assigned_technician: "",
      client_name: "",
      client_id_number: "",
      client_phone: "",
      client_email: "",
      client_address: "",
      vehicle_plate: "",
      vehicle_brand: "",
      vehicle_model: "",
      vehicle_year: "",
      vehicle_mileage: "",
      vehicle_vin: "",
      vehicle_color: "",
      vehicle_fuel_type: "",
      service_description: "",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(id) {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    setEditing(o.id);
    setErrMsg("");
    setForm({
      ...o,
      status: o.status || (o.status_display ? Object.keys(STATUS).find(k => STATUS[k] === o.status_display) : "pending"),
      vehicle_fuel_type: o.vehicle_fuel_type || "",
    });
    setModalOpen(true);
  }

  async function saveForm() {
    setSaving(true);
    
    // --- VALIDACIONES ---
    if (!form.client_name || !form.vehicle_plate || !form.service_description) {
      setErrMsg("Completa: cliente, patente y descripción del servicio.");
      setSaving(false);
      return;
    }
    if (form.entry_date && form.promised_date) {
      if (form.promised_date <= form.entry_date) {
        setErrMsg("La fecha prometida debe ser posterior a la fecha de ingreso.");
        setSaving(false);
        return;
      }
    }

    // --- LIMPIEZA DE DATOS (Para evitar el error 400) ---
    const payload = { ...form };
    Object.keys(payload).forEach(key => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    // --- LLAMADA A LA API ---
    setErrMsg(null);
    try {
      if (editing) {
        await apiPut(`/orders/${editing}/`, payload);
      } else {
        await apiPost("/orders/", payload);
      }
      
      setModalOpen(false); // Cierra el modal
      await loadOrders(); // Recarga la lista de órdenes

    } catch (error) {
      console.error("Error al guardar:", error);
      // Asumimos que el 'error.message' contiene el JSON de validación
      setErrMsg("Error del servidor: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // ESTE BLOQUE DUPLICADO SE HA ELIMINADO

  async function remove(id) {
    if (!confirm("¿Eliminar esta orden?")) return;
    try {
      await apiDelete(`/orders/${id}/`);
      setOrders(arr => arr.filter(o => o.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la orden.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Atgest" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-bold">Atgest</span>
            <span className="hidden sm:inline text-slate-400">/ Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <IconButton title="Salir" onClick={() => { localStorage.clear(); location.href = "/login"; }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
              </svg>
              <span>Salir</span>
            </IconButton>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input type="text" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Buscar por cliente, vehículo o N° orden"
                className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
            </div>
            <PrimaryButton title="Agregar orden" onClick={openAdd}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Agregar orden</span>
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            <div className="col-span-2">N° Orden</div>
            <div className="col-span-2">Cliente</div>
            <div className="col-span-2">Vehículo</div>
            <div className="col-span-2">Asesor / Técnico</div>
            <div className="col-span-2">Fechas</div>
            <div className="col-span-2 text-right pr-1">Estado / Acciones</div>
          </div>

          {loadingList && <div className="px-4 py-8 text-center text-sm text-slate-500">Cargando…</div>}

          <ul className="divide-y">
            {filtered.map(o => (
              <li key={o.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-4">
                <div className="md:col-span-2 font-medium">{o.order_number}</div>
                <div className="md:col-span-2">{o.client_name}</div>
                <div className="md:col-span-2">{`${o.vehicle_brand || ""} ${o.vehicle_model || ""} (${o.vehicle_plate || ""})`}</div>
                <div className="md:col-span-2 text-sm">{o.service_advisor || ""}<br />{o.assigned_technician || ""}</div>
                <div className="md:col-span-2 text-xs text-slate-600">
                  {o.entry_date || "—"} <br />→ {o.promised_date || "—"}
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    (o.status_display === "Completado" || o.status === "done") ? "bg-emerald-100 text-emerald-700"
                      : (o.status_display === "En curso" || o.status === "in_progress") ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {o.status_display || STATUS[o.status] || "Pendiente"}
                  </span>
                  <IconButton title="Editar" onClick={() => openEdit(o.id)} className="px-2 py-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </IconButton>
                  <IconButton title="Eliminar" onClick={() => remove(o.id)} className="px-2 py-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </IconButton>
                </div>
              </li>
            ))}
            {!loadingList && filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                No hay resultados para “{q}”.
              </li>
            )}
          </ul>
        </div>
      </main>

      {/* MODAL (Formulario corregido y re-estructurado) */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar orden" : "Agregar orden"}
        onClose={() => setModalOpen(false)}
        onSubmit={saveForm}
        submitText={saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear orden"}
      >
        {errMsg && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{errMsg}</div>}

        {/* SECCIONES */}
        <div className="space-y-6">
          
          {/* --- Información de la Orden --- */}
          <section>
            <h4 className="font-semibold mb-2">📋 Información de la Orden</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <FormInput id="order_number" label="Número de orden (auto)" value={form.order_number} onChange={() => {}} />
              
              <div className="flex flex-col">
                <label htmlFor="entry_date" className="text-sm font-medium text-gray-700 mb-1">Fecha de ingreso</label>
                <input type="date" id="entry_date" value={form.entry_date || ""} onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm" />
              </div>
              
              <FormInput id="service_advisor" label="Asesor de servicio" value={form.service_advisor} onChange={handleFormChange} />

              <div className="flex flex-col">
                <label htmlFor="promised_date" className="text-sm font-medium text-gray-700 mb-1">Fecha prometida</label>
                <input type="date" id="promised_date" value={form.promised_date || ""} onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm" />
              </div>
              
              <FormInput id="assigned_technician" label="Técnico asignado" value={form.assigned_technician} onChange={handleFormChange} />

              <div className="flex flex-col">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select id="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm">
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="done">Completado</option>
                </select>
              </div>
            </div>
          </section>

          {/* --- Cliente --- */}
          <section>
            <h4 className="font-semibold mb-2">🧑‍💼 Datos del Cliente</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <FormInput id="client_name" label="Nombre del cliente" value={form.client_name} onChange={handleFormChange} />
              <FormInput id="client_id_number" label="RUT / DNI" value={form.client_id_number} onChange={handleFormChange} />
              <FormInput id="client_phone" label="Teléfono" value={form.client_phone} onChange={handleFormChange} />
              <FormInput id="client_email" label="Correo electrónico" type="email" value={form.client_email} onChange={handleFormChange} />
              <div className="md:col-span-2">
                <FormInput id="client_address" label="Dirección" value={form.client_address} onChange={handleFormChange} />
              </div>
            </div>
          </section>

          {/* --- Vehículo --- */}
          <section>
            <h4 className="font-semibold mb-2">🚗 Datos del Vehículo</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <FormInput id="vehicle_plate" label="Patente" value={form.vehicle_plate} onChange={handleFormChange} />
              <FormInput id="vehicle_brand" label="Marca" value={form.vehicle_brand} onChange={handleFormChange} />
              <FormInput id="vehicle_model" label="Modelo" value={form.vehicle_model} onChange={handleFormChange} />
              <FormInput id="vehicle_year" label="Año" type="number" value={form.vehicle_year} onChange={handleFormChange} />
              <FormInput id="vehicle_mileage" label="Kilometraje" type="number" value={form.vehicle_mileage} onChange={handleFormChange} />
              <FormInput id="vehicle_vin" label="VIN" value={form.vehicle_vin} onChange={handleFormChange} />
              <FormInput id="vehicle_color" label="Color" value={form.vehicle_color} onChange={handleFormChange} />
              
              <div className="flex flex-col">
                <label htmlFor="vehicle_fuel_type" className="text-sm font-medium text-gray-700 mb-1">Tipo de combustible</label>
                <select id="vehicle_fuel_type"
                  value={form.vehicle_fuel_type || ""}
                  onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm">
                  {/* El label de adentro se borró */}
                  {FUEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* --- Servicio y Observaciones --- */}
          <section>
            <h4 className="font-semibold mb-2">🔧 Servicio y Observaciones</h4>
            <div className="grid gap-3">
              <div className="flex flex-col">
                <label htmlFor="service_description" className="text-sm font-medium text-gray-700 mb-1">Descripción del servicio</label>
                <textarea id="service_description" value={form.service_description || ""} onChange={handleFormChange}
                  placeholder="Descripción del servicio" className="rounded-lg border px-3 py-2 text-sm min-h-[80px]" />
              </div>
              <div className="flex flex-col">
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <textarea id="notes" value={form.notes || ""} onChange={handleFormChange}
                  placeholder="Observaciones / notas (opcional)" className="rounded-lg border px-3 py-2 text-sm min-h-[60px]" />
              </div>
              <div className="text-xs text-slate-500">
                <div>Creado: {form.created_at || "—"}</div>
                <div>Actualizado: {form.updated_at || "—"}</div>
              </div>
            </div>
          </section>
          
        </div>
      </Modal>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Atgest</span>
          <span className="hidden sm:inline">v0.1 · Demo de panel</span>
        </div>
      </footer>
    </div>
  );
}