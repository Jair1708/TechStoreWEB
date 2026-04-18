// ====================== TECHSTORE - VERSIÓN FINAL CORREGIDA ======================
const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

// Usamos 'client' para evitar el SyntaxError de duplicado
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Cargar productos desde la base de datos
async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) return console.error("Error cargando productos:", error);
  productos = data || [];
  renderCatalogo();
}

// Navegación global
window.mostrarSeccion = function(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");
};

// Control de Login
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  const { error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) {
    alert("❌ Error: " + error.message);
  } else {
    window.cerrarLogin();
    alert("✅ Bienvenido Admin");
    cargarProductos();
  }
};

// Dibujar productos en el HTML
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;
  grid.innerHTML = productos.map(p => `
    <div class="product-card bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <img src="${p.imagen}" class="w-full h-40 object-cover rounded-xl mb-4">
      <h3 class="font-bold text-lg">${p.nombre}</h3>
      <p class="text-orange-500 font-bold">$${p.precio}</p>
      <button onclick="window.agregarAlCarrito(${p.id})" class="mt-4 w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all">
        Agregar
      </button>
    </div>
  `).join('');
}

// Funciones del carrito
window.toggleCart = () => alert("Productos en carrito: " + carrito.length);

window.agregarAlCarrito = function(id) {
  const prod = productos.find(p => p.id === id);
  if (prod) {
    carrito.push(prod);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    document.getElementById("cartCount").innerText = carrito.length;
  }
};

// Al cargar la página
window.onload = function() {
  cargarProductos();
  console.log("%c✅ TechStore v1.0.1 - Conexión establecida", "color:#f97316; font-weight:bold");
};