import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo_.webp";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

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

const STATUS = {
  pending: "Pendiente",
  in_progress: "En curso",
  done: "Completado",
};

const FUEL_OPTIONS = [
  { value: "", label: "No especificado" },
  { value: "gasoline", label: "Gasolina" },
  { value: "diesel", label: "Diésel" },
  { value: "electric", label: "Eléctrico" },
  { value: "hybrid", label: "Híbrido" },
];

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

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d).replace(",", "");
  } catch (e) {
    return "—";
  }
}

function toDateTimeLocalInput(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const formatted = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return formatted.replace(" ", "T");
  } catch (e) {
    return "";
  }
}

function toISOFromLocalInput(localValue) {
  if (!localValue) return null;
  const d = new Date(localValue);
  return d.toISOString();
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
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function loadOrders() {
    setLoadingList(true);
    try {
      const data = await apiGet("/orders/");
      setOrders(data || []);
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
      (o.client_id_number || "").toLowerCase().includes(s) ||
      (o.vehicle_plate || "").toLowerCase().includes(s) ||
      (o.vehicle_brand || "").toLowerCase().includes(s) ||
      (o.order_number || "").toLowerCase().includes(s)
    );
  }, [q, orders]);

  function handleFormChange(e) {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  }

  function openAdd() {
    setEditing(null);
    setErrMsg("");
    const nowLocal = toDateTimeLocalInput(new Date().toISOString());
    setForm({
      status: "pending",
      entry_date: nowLocal,
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
      created_at: "",
      updated_at: "",
    });
    setModalOpen(true);
  }

  function openEdit(id) {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    setEditing(o.id);
    setErrMsg("");
    const entryLocal = toDateTimeLocalInput(o.entry_date || o.entry_date_time || o.created_at);
    const promisedLocal = toDateTimeLocalInput(o.promised_date || o.promised_at);
    setForm({
      ...o,
      status: o.status || "pending",
      vehicle_fuel_type: o.vehicle_fuel_type || "",
      entry_date: entryLocal,
      promised_date: promisedLocal,
    });
    setModalOpen(true);
  }

  async function saveForm() {
    setSaving(true);

    if (!form.client_name || !form.vehicle_plate || !form.service_description) {
      setErrMsg("Completa: cliente, patente y descripción del servicio.");
      setSaving(false);
      return;
    }
    if (form.entry_date && form.promised_date) {
      const isoEntry = toISOFromLocalInput(form.entry_date);
      const isoPromised = toISOFromLocalInput(form.promised_date);
      if (isoPromised && isoEntry && isoPromised <= isoEntry) {
        setErrMsg("La fecha prometida debe ser posterior a la fecha de ingreso.");
        setSaving(false);
        return;
      }
    }

    const payload = { ...form };
    if (payload.entry_date) {
      payload.entry_date = toISOFromLocalInput(payload.entry_date);
    } else {
      payload.entry_date = null;
    }
    if (payload.promised_date) {
      payload.promised_date = toISOFromLocalInput(payload.promised_date);
    } else {
      payload.promised_date = null;
    }

    Object.keys(payload).forEach(key => {
      if (payload[key] === "") payload[key] = null;
    });

    setErrMsg(null);
    try {
      if (editing) {
        await apiPut(`/orders/${editing}/`, payload);
      } else {
        await apiPost("/orders/", payload);
      }

      setModalOpen(false);
      await loadOrders();

    } catch (error) {
      console.error("Error al guardar:", error);
      setErrMsg("Error del servidor: " + (error.message || "desconocido"));
    } finally {
      setSaving(false);
    }
  }

  function remove(id) {
    setDeleteOrderId(id);
    setDeleteConfirmText("");
    setDeleteModal(true);
  }

  async function confirmDelete() {
    if (deleteConfirmText.toLowerCase() !== "aceptar") {
      alert("Debes escribir 'aceptar' para confirmar la eliminación.");
      return;
    }
    try {
      await apiDelete(`/orders/${deleteOrderId}/`);
      setOrders(arr => arr.filter(o => o.id !== deleteOrderId));
      setDeleteModal(false);
      setDeleteOrderId(null);
      setDeleteConfirmText("");
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la orden.");
    }
  }

  function openDetails(id) {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    setSelectedOrder(o);
    setDetailsModal(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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

      <main className="w-full px-4 py-6 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto w-full">
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

        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm max-w-7xl mx-auto w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">N° Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Vehículo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Fecha Ingreso</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingList && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">Cargando…</td>
                  </tr>
                )}
                {!loadingList && filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-sm font-medium">{o.order_number || "—"}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500">RUT:</span>
                          <span className="text-sm font-medium text-slate-700">
                            {o.client_id_number || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500">Nombre:</span>
                          <span className="text-sm text-slate-600">
                            {o.client_name || "—"}
                          </span>
                        </div>
                        {o.client_phone && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-500">Tel:</span>
                            <span className="text-xs text-slate-500">{o.client_phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500">Patente:</span>
                          <span className="text-sm font-medium text-slate-700">{o.vehicle_plate || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500">Marca:</span>
                          <span className="text-xs text-slate-600">{o.vehicle_brand || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500">Modelo:</span>
                          <span className="text-xs text-slate-600">{o.vehicle_model || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        (o.status_display === "Completado" || o.status === "done") ? "bg-emerald-100 text-emerald-700"
                          : (o.status_display === "En curso" || o.status === "in_progress") ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {o.status_display || STATUS[o.status] || "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {formatDateTime(o.entry_date)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <IconButton title="Ver detalles" onClick={() => openDetails(o.id)} className="px-2 py-1">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </IconButton>
                        <IconButton title="Editar" onClick={() => openEdit(o.id)} className="px-2 py-1">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </IconButton>
                        <IconButton title="Eliminar" onClick={() => remove(o.id)} className="px-2 py-1 text-red-600 hover:bg-red-50">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loadingList && filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">
                      No hay resultados para "{q}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Modal open={modalOpen} title={editing ? "Editar orden" : "Agregar orden"}
        onClose={() => setModalOpen(false)} onSubmit={saveForm}
        submitText={saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear orden"}>
        {errMsg && <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{errMsg}</div>}
        <div className="space-y-6">
          <section>
            <h4 className="font-semibold mb-2">📋 Información de la Orden</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Número de orden (automático)</label>
                <input type="text" value={form.order_number || "Se asignará automáticamente"} disabled
                  className="rounded-lg border px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="flex flex-col">
                <label htmlFor="entry_date" className="text-sm font-medium text-gray-700 mb-1">Fecha de ingreso (fecha y hora)</label>
                <input type="datetime-local" id="entry_date" value={form.entry_date || ""} onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm" />
              </div>
              <FormInput id="service_advisor" label="Asesor de servicio" value={form.service_advisor} onChange={handleFormChange} />
              <div className="flex flex-col">
                <label htmlFor="promised_date" className="text-sm font-medium text-gray-700 mb-1">Fecha prometida (fecha y hora)</label>
                <input type="datetime-local" id="promised_date" value={form.promised_date || ""} onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm" />
              </div>
              <FormInput id="assigned_technician" label="Técnico asignado" value={form.assigned_technician} onChange={handleFormChange} />
              <div className="flex flex-col">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select id="status" value={form.status} onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm">
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="done">Completado</option>
                </select>
              </div>
            </div>
          </section>
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
                <select id="vehicle_fuel_type" value={form.vehicle_fuel_type || ""} onChange={handleFormChange}
                  className="rounded-lg border px-3 py-2 text-sm">
                  {FUEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </section>
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
                <div>Creado: {form.created_at ? formatDateTime(form.created_at) : "—"}</div>
                <div>Actualizado: {form.updated_at ? formatDateTime(form.updated_at) : "—"}</div>
              </div>
            </div>
          </section>
        </div>
      </Modal>

      <Modal open={detailsModal} title="Detalles de la Orden"
        onClose={() => setDetailsModal(false)} onSubmit={() => setDetailsModal(false)} submitText="Cerrar">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><span className="text-sm font-semibold text-slate-700">N° Orden:</span><p className="text-sm">{selectedOrder.order_number || "—"}</p></div>
              <div><span className="text-sm font-semibold text-slate-700">Estado:</span><p className="text-sm"><span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${(selectedOrder.status_display === "Completado" || selectedOrder.status === "done") ? "bg-emerald-100 text-emerald-700" : (selectedOrder.status_display === "En curso" || selectedOrder.status === "in_progress") ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{selectedOrder.status_display || STATUS[selectedOrder.status] || "Pendiente"}</span></p></div>
              <div><span className="text-sm font-semibold text-slate-700">Fecha de Ingreso:</span><p className="text-sm">{formatDateTime(selectedOrder.entry_date) || "—"}</p></div>
              <div><span className="text-sm font-semibold text-slate-700">Fecha Prometida:</span><p className="text-sm">{formatDateTime(selectedOrder.promised_date) || "—"}</p></div>
              <div><span className="text-sm font-semibold text-slate-700">Asesor de Servicio:</span><p className="text-sm">{selectedOrder.service_advisor || "—"}</p></div>
              <div><span className="text-sm font-semibold text-slate-700">Técnico Asignado:</span><p className="text-sm">{selectedOrder.assigned_technician || "—"}</p></div>
            </div>
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2 text-slate-700">👤 Cliente</h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div><span className="text-sm font-semibold text-slate-700">Nombre:</span><p className="text-sm">{selectedOrder.client_name || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">RUT/DNI:</span><p className="text-sm">{selectedOrder.client_id_number || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Teléfono:</span><p className="text-sm">{selectedOrder.client_phone || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Email:</span><p className="text-sm">{selectedOrder.client_email || "—"}</p></div>
                <div className="md:col-span-2"><span className="text-sm font-semibold text-slate-700">Dirección:</span><p className="text-sm">{selectedOrder.client_address || "—"}</p></div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2 text-slate-700">🚗 Vehículo</h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div><span className="text-sm font-semibold text-slate-700">Patente:</span><p className="text-sm">{selectedOrder.vehicle_plate || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Marca:</span><p className="text-sm">{selectedOrder.vehicle_brand || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Modelo:</span><p className="text-sm">{selectedOrder.vehicle_model || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Año:</span><p className="text-sm">{selectedOrder.vehicle_year || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Kilometraje:</span><p className="text-sm">{selectedOrder.vehicle_mileage || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">VIN:</span><p className="text-sm">{selectedOrder.vehicle_vin || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Color:</span><p className="text-sm">{selectedOrder.vehicle_color || "—"}</p></div>
                <div><span className="text-sm font-semibold text-slate-700">Combustible:</span><p className="text-sm">{FUEL_OPTIONS.find(f => f.value === selectedOrder.vehicle_fuel_type)?.label || "No especificado"}</p></div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-2 text-slate-700">🔧 Servicio</h5>
              <div><span className="text-sm font-semibold text-slate-700">Descripción:</span><p className="text-sm mt-1 whitespace-pre-wrap">{selectedOrder.service_description || "—"}</p></div>
              {selectedOrder.notes && (<div className="mt-3"><span className="text-sm font-semibold text-slate-700">Observaciones:</span><p className="text-sm mt-1 whitespace-pre-wrap">{selectedOrder.notes}</p></div>)}
            </div>
            <div className="border-t pt-4 text-xs text-slate-500">
              <div>Creado: {selectedOrder.created_at ? formatDateTime(selectedOrder.created_at) : "—"}</div>
              <div>Actualizado: {selectedOrder.updated_at ? formatDateTime(selectedOrder.updated_at) : "—"}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={deleteModal} title="⚠️ Confirmar Eliminación"
        onClose={() => { setDeleteModal(false); setDeleteOrderId(null); setDeleteConfirmText(""); }}
        onSubmit={confirmDelete} submitText="Confirmar">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            ¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              Para confirmar, escribe <span className="font-bold">aceptar</span> en el campo de abajo:
            </p>
          </div>
          <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Escribe 'aceptar' para confirmar"
            className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      </Modal>

      <footer className="border-t bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Atgest</span>
          <span className="hidden sm:inline">v0.1 · Demo de panel</span>
        </div>
      </footer>
    </div>
  );
}