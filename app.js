const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let filtroActual = "todos";

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) {
    console.error(error);
    alert("❌ Error al cargar productos: " + error.message);
    return;
  }
  productos = data || [];
  renderFiltrosCategorias();
  renderCatalogo();
}

function renderFiltrosCategorias() {
  const container = document.getElementById("categoriasFiltro");
  if (!container) return;

  const categorias = ['todos', ...new Set(productos.map(p => p.categoria).filter(c => c && c.trim() !== ''))];

  container.innerHTML = categorias.map(cat => {
    const active = cat === filtroActual;
    const label = cat === 'todos' ? '🌐 Todos' : cat;
    return `
      <button onclick="filtrarPorCategoria('${cat}')" 
              class="px-7 py-3 rounded-3xl font-semibold text-sm transition-all ${active ? 'bg-orange-500 text-black shadow-lg' : 'bg-zinc-800 hover:bg-zinc-700'}">
        ${label}
      </button>`;
  }).join('');
}

window.filtrarPorCategoria = (cat) => {
  filtroActual = cat;
  renderCatalogo();
  renderFiltrosCategorias();
};

// ==================== RENDER CATÁLOGO CON CATEGORÍAS ====================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  let filtered = productos;

  if (filtroActual !== 'todos') {
    filtered = productos.filter(p => p.categoria === filtroActual);
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-3xl text-zinc-400 mb-4">No hay productos en esta categoría</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div onclick="verProducto(${p.id})" class="cursor-pointer bg-zinc-900 rounded-3xl overflow-hidden hover:scale-105 transition-all">
      <img src="${p.imgs}" class="w-full h-56 object-cover">
      <div class="p-4">
        ${p.categoria ? `<span class="inline-block px-4 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-2xl mb-3">${p.categoria}</span>` : ''}
        <h3 class="font-bold text-lg">${p.nombre}</h3>
        <p class="text-orange-400 text-2xl font-bold">$${Number(p.precio).toLocaleString()}</p>
      </div>
    </div>
  `).join('');
}

// ==================== MODAL PRODUCTO ====================
window.verProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  document.getElementById("modalContent").innerHTML = `
    <button onclick="document.getElementById('modal').classList.add('hidden')" class="absolute top-4 right-4 text-4xl text-zinc-400 hover:text-white z-10">×</button>
    <div class="p-6 pt-12">
      <img src="${p.imgs}" class="w-full rounded-2xl mb-6">
      ${p.categoria ? `<span class="inline-block px-4 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-2xl">${p.categoria}</span>` : ''}
      <h2 class="text-3xl font-bold mt-3">${p.nombre}</h2>
      <p class="text-orange-400 text-4xl font-bold mt-2">$${Number(p.precio).toLocaleString()}</p>
      <p class="mt-6 text-zinc-300 leading-relaxed">${p.descripcion || "Sin descripción"}</p>
      
      <button onclick="agregarAlCarrito(${p.id}); document.getElementById('modal').classList.add('hidden')" 
              class="w-full mt-8 bg-orange-500 py-5 rounded-3xl font-bold text-xl">
        🛒 Agregar al carrito
      </button>
    </div>
  `;
  document.getElementById("modal").classList.remove("hidden");
};

// ==================== ADMIN ====================
const ADMIN_EMAIL = "jairandresospina12@gmail.com";
const ADMIN_PASS = "1070601857";
let editingId = null;

window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");

window.login = () => {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value;

  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdminProductos();
  } else {
    alert("❌ Credenciales incorrectas");
  }
};

window.cerrarAdminPanel = () => {
  document.getElementById("adminPanel").classList.add("hidden");
  cancelarEdicion();
};

function renderAdminProductos() {
  const container = document.getElementById("adminProductosList");
  if (productos.length === 0) {
    container.innerHTML = `<p class="text-zinc-400 text-center py-8">Aún no hay productos</p>`;
    return;
  }

  container.innerHTML = productos.map(p => `
    <div class="flex gap-4 bg-zinc-800 rounded-2xl p-4">
      <img src="${p.imgs}" class="w-20 h-20 object-cover rounded-xl">
      <div class="flex-1">
        <span class="text-xs text-orange-400">${p.categoria || 'Sin categoría'}</span>
        <h4 class="font-bold">${p.nombre}</h4>
        <p class="text-orange-400 text-xl">$${Number(p.precio).toLocaleString()}</p>
      </div>
      <div class="flex flex-col gap-2">
        <button onclick="editarProducto(${p.id})" class="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-2xl text-sm font-bold">Editar</button>
        <button onclick="eliminarProducto(${p.id})" class="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-2xl text-sm font-bold">Eliminar</button>
      </div>
    </div>
  `).join('');
}

// ==================== EDITAR / GUARDAR ====================
window.editarProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  editingId = id;
  document.getElementById("formTitle").textContent = "Editar Producto";
  document.getElementById("btnGuardar").textContent = "Guardar Cambios";
  
  document.getElementById("pNombre").value = p.nombre;
  document.getElementById("pPrecio").value = p.precio;
  document.getElementById("pCategoria").value = p.categoria || "";
  document.getElementById("pDesc").value = p.descripcion || "";
};

window.cancelarEdicion = () => {
  editingId = null;
  document.getElementById("formTitle").textContent = "Nuevo Producto";
  document.getElementById("btnGuardar").textContent = "Publicar Producto";
  document.getElementById("pNombre").value = "";
  document.getElementById("pPrecio").value = "";
  document.getElementById("pCategoria").value = "";
  document.getElementById("pDesc").value = "";
  document.getElementById("pArchivo").value = "";
};

window.guardarProducto = async () => {
  const file = document.getElementById("pArchivo").files[0];
  const nombre = document.getElementById("pNombre").value.trim();
  const precio = document.getElementById("pPrecio").value;
  const categoria = document.getElementById("pCategoria").value.trim();
  const descripcion = document.getElementById("pDesc").value.trim();

  if (!nombre || !precio) return alert("❌ Faltan datos");

  let imageUrl = null;
  if (file) {
    const fileName = Date.now() + "_" + file.name;
    const { error: uploadError } = await client.storage.from('imagenes_productos').upload(fileName, file);
    if (uploadError) return alert("❌ Error al subir imagen: " + uploadError.message);
    const { data: urlData } = client.storage.from('imagenes_productos').getPublicUrl(fileName);
    imageUrl = urlData.publicUrl;
  }

  const productData = {
    nombre,
    precio: parseFloat(precio),
    categoria: categoria || null,
    descripcion
  };

  if (editingId) {
    if (imageUrl) productData.imgs = imageUrl;
    const { error } = await client.from('productos').update(productData).eq('id', editingId);
    if (error) return alert("❌ Error al actualizar: " + error.message);
    alert("✅ Producto actualizado");
  } else {
    if (!file) return alert("❌ Debes subir una imagen");
    productData.imgs = imageUrl;
    const { error } = await client.from('productos').insert([productData]);
    if (error) return alert("❌ Error al guardar: " + error.message);
    alert("✅ Producto publicado");
  }

  cancelarEdicion();
  await cargarProductos();
  renderAdminProductos();
};

// ==================== ELIMINAR ====================
window.eliminarProducto = async (id) => {
  if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
  const { error } = await client.from('productos').delete().eq('id', id);
  if (error) return alert("❌ Error al eliminar: " + error.message);
  alert("✅ Producto eliminado");
  await cargarProductos();
  renderAdminProductos();
};

// ==================== CARRITO (sin cambios) ====================
window.toggleCart = () => { /* ... mismo código anterior ... */ };
window.agregarAlCarrito = (id) => { /* ... mismo ... */ };
function actualizarCarrito() { /* ... */ }
function renderCarrito() { /* ... */ }
window.eliminarDelCarrito = (i) => { /* ... */ };
window.comprarPorWhatsApp = () => { /* ... */ };
function mostrarToast(msg) { /* ... */ };

// ==================== MENÚ MÓVIL ====================
window.toggleMobileMenu = () => {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("hidden");
};

// ==================== INICIO ====================
window.mostrarSeccion = (id) => {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

window.onload = () => {
  cargarProductos();
  actualizarCarrito();
};