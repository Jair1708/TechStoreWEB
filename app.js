// ====================== TECHSTORE - FIX CARGA LOCAL ======================
const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

// Usamos 'db' para evitar el error "Identifier 'supabase' has already been declared"
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];

async function cargarProductos() {
  const { data, error } = await db.from('productos').select('*');
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
      <p class="text-orange-500 font-bold">$${Number(p.precio).toLocaleString()}</p>
      <button class="mt-4 w-full bg-white text-black py-2 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all">Ver detalles</button>
    </div>
  `).join('');
}

window.mostrarSeccion = (id) => {
  const seccion = document.getElementById(id);
  if (seccion) {
    document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
    seccion.classList.remove("hidden");
  }
};

window.abrirLogin = () => {
  const loginBox = document.getElementById("loginBox");
  if (loginBox) loginBox.classList.remove("hidden");
};

window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) alert("❌ Acceso denegado");
  else {
    window.cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
  }
};

window.guardarProducto = async function() {
  const fileInput = document.getElementById("pArchivo");
  const file = fileInput.files[0];
  const nombre = document.getElementById("pNombre").value;
  const precio = document.getElementById("pPrecio").value;
  const descripcion = document.getElementById("pDesc").value;

  if (!file || !nombre || !precio) return alert("⚠️ Selecciona una imagen y llena los datos");

  // 1. Subir al Bucket que creaste: IMAGENES_PRODUCTOS
  const nombreLimpio = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const { data: uploadData, error: uploadError } = await db.storage
    .from('IMAGENES_PRODUCTOS')
    .upload(nombreLimpio, file);

  if (uploadError) return alert("❌ Error al subir: " + uploadError.message);

  // 2. Obtener la URL pública
  const { data: urlData } = db.storage.from('IMAGENES_PRODUCTOS').getPublicUrl(nombreLimpio);
  const publicUrl = urlData.publicUrl;

  // 3. Guardar en tabla 'productos' (columna 'imgs')
  const { error: dbError } = await db.from('productos').insert([{
    nombre,
    precio: parseFloat(precio),
    descripcion,
    imgs: publicUrl
  }]);

  if (dbError) alert("❌ Error DB: " + dbError.message);
  else {
    alert("✅ Producto guardado correctamente");
    window.cerrarAdmin();
    cargarProductos();
  }
};

window.onload = cargarProductos;