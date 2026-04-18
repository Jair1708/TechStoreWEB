const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) return console.error("Error:", error);
  productos = data || [];
  renderCatalogo();
}

window.mostrarSeccion = function(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");
};

window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();
  const { error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) {
    alert("❌ Acceso denegado");
  } else {
    window.cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
  }
};

window.guardarProducto = async function() {
  const imgInput = document.getElementById("pImagenes").value;
  const listaImagenes = imgInput.split(',').map(img => img.trim());

  const nuevoProducto = {
    nombre: document.getElementById("pNombre").value,
    precio: parseInt(document.getElementById("pPrecio").value),
    descripcion: document.getElementById("pDesc").value,
    colores: document.getElementById("pColores").value,
    tallas: document.getElementById("pTallas").value,
    imagen: listaImagenes[0], // Primera como principal
    carrusel: listaImagenes    // Array completo para el carrusel
  };

  if(!nuevoProducto.nombre || !nuevoProducto.precio) return alert("Llena los campos obligatorios");

  const { error } = await client.from('productos').insert([nuevoProducto]);

  if (error) {
    alert("Error al guardar: " + error.message);
  } else {
    alert("✅ Producto agregado correctamente");
    window.cerrarAdmin();
    cargarProductos();
    // Limpiar formulario
    ["pNombre", "pPrecio", "pDesc", "pColores", "pTallas", "pImagenes"].forEach(id => document.getElementById(id).value = "");
  }
};

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;
  grid.innerHTML = productos.map(p => `
    <div class="product-card bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <img src="${p.imagen}" class="w-full h-48 object-cover rounded-xl mb-4">
      <h3 class="font-bold text-lg">${p.nombre}</h3>
      <p class="text-orange-500 font-bold">$${p.precio.toLocaleString()}</p>
      <button onclick="window.agregarAlCarrito(${p.id})" class="mt-4 w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all">
        Agregar al carrito
      </button>
    </div>
  `).join('');
}

window.toggleCart = () => alert("Tienes " + carrito.length + " productos en el carrito");

window.onload = () => {
  cargarProductos();
};