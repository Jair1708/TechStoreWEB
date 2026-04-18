const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

// Usamos 'client' para evitar el error de 'supabase' ya declarado
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = [];

async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) return console.error("Error:", error);
  productos = data || [];
  renderCatalogo();
}

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;
  grid.innerHTML = productos.map(p => `
    <div class="product-card bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <img src="${p.imgs}" class="w-full h-48 object-cover rounded-xl mb-4" onerror="this.src='https://via.placeholder.com/150'">
      <h3 class="font-bold text-lg">${p.nombre}</h3>
      <p class="text-orange-500 font-bold">$${p.precio.toLocaleString()}</p>
      <button class="mt-4 w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all">Ver Más</button>
    </div>
  `).join('');
}

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
  if (error) {
    alert("❌ Error de acceso");
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
    imgs: document.getElementById("pImgs").value
  };

  const { error } = await client.from('productos').insert([nuevo]);
  if (error) return alert("Error al guardar: " + error.message);
  
  alert("✅ ¡Producto Guardado!");
  window.cerrarAdmin();
  cargarProductos();
};

window.onload = cargarProductos;