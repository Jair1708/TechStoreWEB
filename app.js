// ====================== TECHSTORE - VERSIÓN FINAL CORREGIDA ======================
const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

// Usamos 'client' para evitar el error "Identifier 'supabase' has already been declared"
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let searchTerm = "";

// Cargar productos desde la DB
async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) return console.error("Error:", error);
  productos = data || [];
  renderCatalogo();
}

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;
  const filtered = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  
  grid.innerHTML = filtered.map(p => `
    <div class="product-card bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <img src="${p.imgs}" class="w-full h-48 object-cover rounded-xl mb-4" onerror="this.src='https://via.placeholder.com/150'">
      <h3 class="font-bold text-lg">${p.nombre}</h3>
      <p class="text-orange-500 font-bold">$${Number(p.precio).toLocaleString()}</p>
      <button onclick="agregarAlCarrito(${p.id})" class="mt-4 w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all">
        <i class="fa-solid fa-cart-plus"></i> Agregar
      </button>
    </div>
  `).join('');
}

// --- LÓGICA DEL CARRITO REINSTALADA ---
window.toggleCart = () => document.getElementById("cartPanel").classList.toggle("translate-x-full");

window.agregarAlCarrito = (id) => {
  const p = productos.find(prod => prod.id === id);
  if (p) {
    carrito.push(p);
    actualizarCarrito();
    mostrarToast("✅ Agregado al carrito");
  }
};

function actualizarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  document.getElementById("cartCount").innerText = carrito.length;
  renderCarrito();
}

function renderCarrito() {
  const container = document.getElementById("cartItems");
  if (!container) return;
  container.innerHTML = carrito.map((p, i) => `
    <div class="flex items-center justify-between bg-zinc-800 p-3 rounded-xl mb-2">
      <div class="flex items-center gap-3">
        <img src="${p.imgs}" class="w-12 h-12 object-cover rounded-lg">
        <div>
          <p class="text-sm font-bold leading-tight">${p.nombre}</p>
          <p class="text-xs text-orange-500">$${Number(p.precio).toLocaleString()}</p>
        </div>
      </div>
      <button onclick="eliminarDelCarrito(${i})" class="text-zinc-500 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');
}

window.eliminarDelCarrito = (i) => {
  carrito.splice(i, 1);
  actualizarCarrito();
};

window.comprarPorWhatsApp = () => {
  if (carrito.length === 0) return alert("El carrito está vacío");
  let msg = "¡Hola! Quiero estos productos:%0A";
  carrito.forEach(p => msg += `- ${p.nombre} ($${p.precio})%0A`);
  window.open(`https://wa.me/573000000000?text=${msg}`, "_blank");
};

// --- NAVEGACIÓN Y ADMIN ---
window.mostrarSeccion = (id) => {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;
  const { error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) alert("❌ Error de acceso");
  else {
    window.cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    mostrarToast("✅ Modo Admin Activo");
  }
};

window.guardarProducto = async function() {
  const fileInput = document.getElementById("pArchivo");
  const file = fileInput.files[0];
  const nombre = document.getElementById("pNombre").value;
  const precio = document.getElementById("pPrecio").value;
  const descripcion = document.getElementById("pDesc").value;

  if (!file || !nombre || !precio) return alert("⚠️ Completa los campos");

  // IMPORTANTE: El nombre del bucket debe ser EXACTO al de Supabase (ej: 'IMAGENES_PRODUCTOS')
  const nombreArchivo = `${Date.now()}_${file.name}`;
  const { data, error: uploadError } = await client.storage
    .from('imagenes_productos') // <-- VERIFICA MAYÚSCULAS AQUÍ
    .upload(nombreArchivo, file);

  if (uploadError) return alert("❌ Error al subir: " + uploadError.message);

  const { data: urlData } = client.storage.from('IMAGENES_PRODUCTOS').getPublicUrl(nombreArchivo);
  
  const { error: dbError } = await client.from('productos').insert([{
    nombre, precio: parseFloat(precio), descripcion, imgs: urlData.publicUrl
  }]);

  if (dbError) alert("Error DB: " + dbError.message);
  else {
    alert("✅ Producto subido con éxito");
    window.cerrarAdmin();
    cargarProductos();
  }
};

function mostrarToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => t.classList.add("translate-y-20", "opacity-0"), 3000);
}

window.onload = () => {
  cargarProductos();
  actualizarCarrito();
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderCatalogo();
  });
};