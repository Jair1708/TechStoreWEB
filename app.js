const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

// Usamos 'client' para no chocar con la librería global
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];

async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) return console.error("Error cargando productos:", error);
  productos = data || [];
  renderCatalogo();
}

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;
  grid.innerHTML = productos.map(p => `
    <div class="product-card bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <img src="${p.imagen}" class="w-full h-48 object-cover rounded-xl mb-4" onerror="this.src='https://via.placeholder.com/150'">
      <h3 class="font-bold text-lg">${p.nombre}</h3>
      <p class="text-orange-500 font-bold">$${p.precio.toLocaleString()}</p>
      <button class="mt-4 w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all">Ver Detalles</button>
    </div>
  `).join('');
}

window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;
  const { error } = await client.auth.signInWithPassword({ email, password: pass });
  if (error) {
    alert("❌ Error: " + error.message);
  } else {
    window.cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
  }
};

window.guardarProducto = async function() {
  const nuevo = {
    nombre: document.getElementById("pNombre").value,
    precio: parseInt(document.getElementById("pPrecio").value),
    descripcion: document.getElementById("pDesc").value,
    colores: document.getElementById("pColores").value,
    tallas: document.getElementById("pTallas").value,
    imagen: document.getElementById("pImagenes").value
  };

  const { error } = await client.from('productos').insert([nuevo]);
  if (error) return alert("Error: " + error.message);
  
  alert("✅ Guardado");
  window.cerrarAdmin();
  cargarProductos();
};

window.onload = cargarProductos;