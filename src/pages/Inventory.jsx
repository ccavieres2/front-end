import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo_.webp";
// Asumo que tienes estas funciones en tu lib/api
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

/* --- UI helpers --- */

function IconButton({ title, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 ${className}`}
    >
      {children}
    </button>
  );
}

// Añadido de nuevo PrimaryButton
function PrimaryButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
    >
      {children}
    </button>
  );
}

// Añadido de nuevo Modal
function Modal({ open, title, onClose, onSubmit, children, submitText = "Guardar" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
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
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Mapeo de estados (API <-> UI) para Inventario --- */
// Añadido de nuevo
const ESTADO_STOCK = {
  en_stock: "En Stock",
  bajo_stock: "Bajo Stock",
  agotado: "Agotado",
};

export default function Inventario() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // --- Estados de datos y UI (Añadidos de nuevo) ---
  const [items, setItems] = useState([]); 
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // ID del ítem a editar
  const [form, setForm] = useState({ 
    nombre: "", 
    sku: "", 
    cantidad: 0, 
    stock_minimo: 5, // <--- Re-introducido para coincidir con el backend
    precio: 0, 
    proveedor: "",
    descripcion: ""
  });
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  /* --- Lógica de API (Añadida de nuevo) --- */

  // Función para cargar los artículos de inventario desde API
  async function loadItems() {
    setLoadingList(true);
    try {
      // Usamos la ruta del urls.py de la app de Django
      const data = await apiGet("/inventory/");
      
      const normalized = data.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        sku: item.sku || "N/A", 
        cantidad: item.cantidad,
        stock_minimo: item.stock_minimo, // <--- Re-introducido
        precio: item.precio,
        proveedor: item.proveedor || "N/A",
        descripcion: item.descripcion,
        estado_stock: ESTADO_STOCK[item.estado_stock] || "Desconocido", // Mapeo de estado
        created_at: item.created_at,
      }));
      setItems(normalized);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar los artículos de inventario.");
    } finally {
      setLoadingList(false);
    }
  }
  
  useEffect(() => {
    loadItems();
  }, []);

  // Filtrado
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (item) =>
        item.nombre.toLowerCase().includes(s) ||
        item.sku.toLowerCase().includes(s) ||
        item.proveedor.toLowerCase().includes(s) ||
        item.estado_stock.toLowerCase().includes(s)
    );
  }, [q, items]);

  // Abrir modal para Agregar
  function openAdd() {
    setErrMsg("");
    setForm({ 
      nombre: "", 
      sku: "", 
      cantidad: 0, 
      stock_minimo: 5, // <--- Valor por defecto del modelo
      precio: 0, 
      proveedor: "",
      descripcion: ""
    });
    setEditing(null);
    setModalOpen(true);
  }
  
  // Abrir modal para Editar
  function openEdit(id) {
    const item = items.find((x) => x.id === id);
    if (!item) return;
    setErrMsg("");
    setForm({ 
      nombre: item.nombre, 
      sku: item.sku === "N/A" ? "" : item.sku,
      cantidad: item.cantidad, 
      stock_minimo: item.stock_minimo, // <--- Re-introducido
      precio: item.precio, 
      proveedor: item.proveedor === "N/A" ? "" : item.proveedor,
      descripcion: item.descripcion
    });
    setEditing(item.id);
    setModalOpen(true);
  }

  // Guardar (Agregar o Editar)
  async function saveForm() {
    // Validación actualizada con stock_minimo
    if (!form.nombre.trim() || form.cantidad < 0 || form.stock_minimo < 0 || form.precio < 0) {
      setErrMsg("El nombre es obligatorio. Cantidad, stock mínimo y precio deben ser >= 0.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        sku: form.sku.trim() || null, 
        cantidad: Number(form.cantidad),
        stock_minimo: Number(form.stock_minimo), // <--- Re-introducido
        precio: Number(form.precio),
        proveedor: form.proveedor.trim() || "",
        descripcion: form.descripcion.trim() || "",
      };
      
      if (editing) {
        await apiPut(`/inventory/${editing}/`, payload);
      } else {
        await apiPost("/inventory/", payload); // <--- CORREGIDO
      }
      
      setModalOpen(false);
      await loadItems(); // Recargar la lista
    } catch (e) {
      console.error(e);
      setErrMsg("No se pudo guardar el artículo de inventario.");
    } finally {
      setSaving(false);
    }
  }

  // Eliminar
  async function remove(id) {
    if (!confirm("¿Eliminar este artículo del inventario?")) return;
    try {
      // La ruta DELETE es /api/inventario/{id}/
      await apiDelete(`/inventory/${id}/`);
      setItems((arr) => arr.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el artículo.");
    }
  }

  /* --- Renderizado del Layout --- */

  return (
    // 👇 Layout en columna
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* -------------------- NAVBAR (logo izq / drawer der) -------------------- */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Atgest" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-bold">Atgest</span>
            <span className="hidden sm:inline text-slate-400">/</span>
            {/* Título de la sección actual */}
            <span className="hidden sm:inline text-slate-500">Inventario</span> 
          </div>
          <div className="flex items-center gap-2">
            <IconButton title="Alertas">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2z" />
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z" />
              </svg>
              <span>Alertas</span>
            </IconButton>
            <IconButton
              title="Salir"
              onClick={() => {
                localStorage.clear();
                location.href = "/login";
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
              </svg>
              <span>Salir</span>
            </IconButton>
            <button
              className="rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setDrawerOpen(true)}
              title="Abrir menú"
              aria-label="Abrir menú"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* -------------------- Drawer derecho -------------------- */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setDrawerOpen(false)} />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l shadow-lg transform transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="font-semibold">Panel</div>
          <button
            className="ml-auto rounded-lg p-2 hover:bg-slate-100"
            onClick={() => setDrawerOpen(false)}
            title="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="p-3 space-y-1 text-sm">
          {/* Marcar "Inventario" como activo (o el link que corresponda) */}
          {[ "Inventario", "Órdenes", "Clientes", "Servicios", "Ajustes"].map((label) => (
            <a 
              key={label} 
              href="#" // Puedes cambiar el href real si tienes ruteo
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                label === "Inventario" ? "bg-slate-100 font-semibold" : "hover:bg-slate-100"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* -------------------- Contenido: Inventario (Añadido de nuevo) -------------------- */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, SKU, proveedor…"
                className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </span>
            </div>
            <PrimaryButton title="Agregar Artículo" onClick={openAdd}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Agregar Artículo</span>
            </PrimaryButton>
          </div>
        </div>

        {/* --- Tabla de Artículos --- */}
        <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
            <div className="col-span-3">Artículo</div>
            <div className="col-span-2">SKU/Referencia</div>
            <div className="col-span-2">Proveedor</div>
            <div className="col-span-2 text-center">Cantidad</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-1 text-right pr-1">Acciones</div>
          </div>

          {loadingList && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Cargando inventario…</div>
          )}

          <ul className="divide-y">
            {filtered.map((item) => (
              <li key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-4">
                
                {/* Nombre (y SKU/Proveedor en móvil) */}
                <div className="md:col-span-3">
                  <div className="font-medium text-base">{item.nombre}</div>
                  <div className="md:hidden text-xs text-slate-500">SKU: {item.sku} | Proveedor: {item.proveedor}</div>
                </div>
                
                {/* SKU (Desktop) */}
                <div className="hidden md:block md:col-span-2 text-slate-700">{item.sku}</div>
                
                {/* Proveedor (Desktop) */}
                <div className="hidden md:block md:col-span-2 text-slate-700">{item.proveedor}</div>
                
                {/* Cantidad (con alerta de stock mínimo) */}
                <div className="md:col-span-2 text-slate-700 text-center">
                    {item.cantidad} 
                    {/* Lógica de alerta basada en stock_minimo del backend */}
                    {item.cantidad > 0 && item.cantidad <= item.stock_minimo && (
                      <span title={`Stock Mínimo: ${item.stock_minimo}`} className="ml-1 text-xs text-amber-500 font-medium">⚠️</span>
                    )}
                </div>

                {/* Estado */}
                <div className="md:col-span-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      item.estado_stock === ESTADO_STOCK.agotado
                        ? "bg-red-100 text-red-700"
                        : item.estado_stock === ESTADO_STOCK.bajo_stock
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.estado_stock}
                  </span>
                </div>
                
                {/* Acciones */}
                <div className="md:col-span-1 flex items-center justify-end gap-2">
                  <IconButton title="Editar" onClick={() => openEdit(item.id)} className="px-2 py-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </IconButton>
                  <IconButton title="Eliminar" onClick={() => remove(item.id)} className="px-2 py-1">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </IconButton>
                </div>
              </li>
            ))}
            
            {/* Mensaje de No Resultados */}
            {!loadingList && filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">
                {q ? `No hay resultados para “${q}”.` : "No hay artículos en el inventario."}
              </li>
            )}
          </ul>
        </div>
      </main>

      {/* -------------------- FOOTER pegado abajo (Añadido de nuevo) -------------------- */}
      <footer className="mt-auto border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Atgest</span>
          <span className="hidden sm:inline">v0.1 · Demo de panel</span>
        </div>
      </footer>

      {/* -------------------- Modal agregar/editar Artículos (Añadido de nuevo) -------------------- */}
      <Modal
        open={modalOpen}
        title={editing ? "Editar Artículo" : "Agregar Artículo"}
        onClose={() => setModalOpen(false)}
        onSubmit={saveForm}
        submitText={saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear Artículo"}
      >
        {errMsg && (
          <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">{errMsg}</div>
        )}
        <div className="grid gap-4">
          
          {/* Nombre del Artículo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Artículo *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código SKU/Referencia</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          
          {/* Cantidad y Stock Mínimo en la misma fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad en Stock *</label>
              <input
                type="number"
                min="0"
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            {/* NUEVO CAMPO para stock_minimo */}
            <div>
              {/* 👇 LA CORRECCIÓN ESTÁ AQUÍ */}
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo *</label>
              <input
                type="number"
                min="0"
                value={form.stock_minimo}
                onChange={(e) => setForm((f) => ({ ...f, stock_minimo: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          
          {/* Precio y Proveedor en la misma fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Unitario *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm((f) => ({ ...f, precio: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <input
                type="text"
                value={form.proveedor}
                onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              rows="3"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

        </div>
      </Modal>
    </div>
  );
}