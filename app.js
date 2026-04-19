// ====================== TECHSTORE - VERSIÓN CORREGIDA ======================
const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let searchTerm = "";

// Cargar productos con mejor manejo de errores
async function cargarProductos() {
  const loading = document.getElementById("catalogoGrid");
  loading.innerHTML = `<div class="col-span-full text-center py-12"><i class="fa-solid fa-spinner fa-spin text-4xl text-orange-500"></i><p class="mt-4 text-zinc-400">Cargando productos...</p></div>`;

  const { data, error } = await client.from('productos').select('*').order('id', { ascending: false });

  if (error) {
    console.error("Error cargando productos:", error);
    document.getElementById("catalogoGrid").innerHTML = `
      <div class="col-span-full text-center py-12 text-red-400">
        <i class="fa-solid fa-triangle-exclamation text-5xl"></i>
        <p class="mt-4">No se pudieron cargar los productos.<br>
        <small>Revisa las políticas RLS en Supabase</small></p>
      </div>`;
    return;
  }

  productos = data || [];
  renderCatalogo();
}

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  const empty = document.getElementById("emptyState");
  const filtrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtrados.length === 0) {
    empty.classList.remove("hidden");
    grid.innerHTML = "";
    return;
  }

  empty.classList.add("hidden");

  grid.innerHTML = filtrados.map(p => `
    <div class="product-card group bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2">
      <div class="relative">
        <img src="${p.imgs || 'https://via.placeholder.com/400x300?text=Sin+imagen'}" 
             class="w-full h-64 object-cover" 
             onerror="this.src='https://via.placeholder.com/400x300?text=Sin+imagen'">
        <div class="absolute top-4 right-4 bg-black/80 text-white text-xs px-3 py-1 rounded-2xl font-bold">$${Number(p.precio).toLocaleString()}</div>
      </div>
      <div class="p-6">
        <h3 class="font-bold text-xl mb-1">${p.nombre}</h3>
        <p class="text-zinc-400 text-sm mb-6 line-clamp-3">${p.descripcion || "Sin descripción"}</p>
        <button onclick="agregarAlCarrito(${p.id})" class="w-full bg-white text-black py-4 rounded-2xl font-bold group-hover:bg-orange-500 group-hover:text-white transition-all">
          Agregar al carrito
        </button>
      </div>
    </div>
  `).join('');
}

// ==================== EL RESTO DEL CÓDIGO (no cambiar) ====================
window.mostrarSeccion = (id) => {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");
};

window.toggleMobileMenu = () => document.getElementById("mobileMenu").classList.toggle("hidden");
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  const { error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) return alert("❌ Email o contraseña incorrectos");
  cerrarLogin();
  document.getElementById("adminPanel").classList.remove("hidden");
  mostrarToast("✅ Bienvenido Admin");
};

function initPreview() {
  const fileInput = document.getElementById("pArchivo");
  const previewImg = document.getElementById("previewImg");
  const placeholder = document.getElementById("previewPlaceholder");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewImg.classList.remove("hidden");
      placeholder.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  });
}

window.guardarProducto = async function() {
  const file = document.getElementById("pArchivo").files[0];
  const nombre = document.getElementById("pNombre").value.trim();
  const precio = document.getElementById("pPrecio").value;
  const descripcion = document.getElementById("pDesc").value.trim();

  if (!file || !nombre || !precio) return alert("⚠️ Completa todos los campos y selecciona una imagen");

  const nombreArchivo = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

  const { error: uploadError } = await client.storage
    .from('imagenes_productos')
    .upload(nombreArchivo, file);

  if (uploadError) return alert("❌ Error al subir imagen: " + uploadError.message);

  const { data: urlData } = client.storage.from('imagenes_productos').getPublicUrl(nombreArchivo);

  const { error: dbError } = await client.from('productos').insert([{
    nombre,
    precio: parseFloat(precio),
    descripcion,
    imgs: urlData.publicUrl
  }]);

  if (dbError) return alert("❌ Error al guardar: " + dbError.message);

  alert("✅ ¡Producto publicado con éxito!");
  cerrarAdmin();
  document.getElementById("pNombre").value = "";
  document.getElementById("pPrecio").value = "";
  document.getElementById("pDesc").value = "";
  document.getElementById("pArchivo").value = "";
  cargarProductos();   // ← recarga el catálogo automáticamente
};

window.toggleCart = () => document.getElementById("cartPanel").classList.toggle("translate-x-full");

window.agregarAlCarrito = (id) => {
  const p = productos.find(prod => prod.id === id);
  if (p) {
    carrito.push(p);
    actualizarCarrito();
    mostrarToast("✅ Producto añadido");
  }
};

function actualizarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  document.getElementById("cartCount").innerText = carrito.length;
  renderCarrito();
}

function renderCarrito() {
  const container = document.getElementById("cartItems");
  let total = 0;
  container.innerHTML = carrito.map((p, i) => {
    total += Number(p.precio) || 0;
    return `
      <div class="flex gap-4 bg-zinc-800 rounded-2xl p-4">
        <img src="${p.imgs}" class="w-16 h-16 object-cover rounded-xl">
        <div class="flex-1">
          <h4 class="font-bold">${p.nombre}</h4>
          <p class="text-orange-400">$${Number(p.precio).toLocaleString()}</p>
        </div>
        <button onclick="eliminarDelCarrito(${i})" class="text-red-500 self-start text-xl"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }).join('');
  document.getElementById("cartTotal").textContent = "$" + total.toLocaleString();
}

window.eliminarDelCarrito = (i) => { carrito.splice(i, 1); actualizarCarrito(); };

window.comprarPorWhatsApp = () => {
  if (carrito.length === 0) return alert("Tu carrito está vacío");
  let msg = "¡Hola! Quiero comprar:%0A%0A" + 
            carrito.map(p => `- ${p.nombre} → $${Number(p.precio).toLocaleString()}`).join("%0A") +
            "%0A%0ATotal: $" + carrito.reduce((sum, p) => sum + Number(p.precio), 0).toLocaleString();
  window.open(`https://wa.me/573248777231?text=${msg}`, "_blank");  // ← tu número real
};

function mostrarToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2800);
}

window.onload = () => {
  cargarProductos();
  actualizarCarrito();
  initPreview();

  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderCatalogo();
  });
};