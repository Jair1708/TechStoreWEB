const SUPABASE_URL = "https://dlzerjvbqixllkkralfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemVyanZicWl4bGxra3JhbGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDIyNzksImV4cCI6MjA5MjAxODI3OX0.5mtSxbh_0LOfdQ-b1LlskylovoZa1zeyn1gFx5owQYM";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ==================== CREDENCIALES ADMIN ====================
const ADMIN_EMAIL = "admin@techstore.com";
const ADMIN_PASS = "admin123";

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
  const { data, error } = await client.from('productos').select('*');
  if (error) {
    console.error(error);
    alert("❌ Error al cargar productos: " + error.message);
    return;
  }
  productos = data || [];
  renderCatalogo();
}

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  
  if (productos.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-3xl text-zinc-400 mb-4">No hay productos en el catálogo todavía</p>
        <button onclick="abrirLogin()" class="bg-orange-500 px-8 py-4 rounded-3xl font-bold">Agregar el primero como Admin</button>
      </div>`;
    return;
  }

  grid.innerHTML = productos.map(p => `
    <div onclick="verProducto(${p.id})" class="cursor-pointer bg-zinc-900 rounded-3xl overflow-hidden hover:scale-105 transition-all">
      <img src="${p.imgs}" class="w-full h-56 object-cover">
      <div class="p-4">
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
    <div class="p-6">
      <button onclick="document.getElementById('modal').classList.add('hidden')" class="float-right text-4xl text-zinc-400">×</button>
      <img src="${p.imgs}" class="w-full rounded-2xl mb-6">
      <h2 class="text-3xl font-bold">${p.nombre}</h2>
      <p class="text-orange-400 text-4xl font-bold mt-2">$${Number(p.precio).toLocaleString()}</p>
      <p class="mt-6 text-zinc-300">${p.descripcion || "Sin descripción"}</p>
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
    renderAdminProductos();           // carga la lista de productos
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
        <h4 class="font-bold">${p.nombre}</h4>
        <p class="text-orange-400 text-xl">$${Number(p.precio).toLocaleString()}</p>
        <p class="text-sm text-zinc-400 line-clamp-2">${p.descripcion || "Sin descripción"}</p>
      </div>
      <div class="flex flex-col gap-2">
        <button onclick="editarProducto(${p.id})" 
                class="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-2xl text-sm font-bold">Editar</button>
        <button onclick="eliminarProducto(${p.id})" 
                class="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-2xl text-sm font-bold">Eliminar</button>
      </div>
    </div>
  `).join('');
}

// ==================== EDITAR PRODUCTO ====================
window.editarProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  editingId = id;
  document.getElementById("formTitle").textContent = "Editar Producto";
  document.getElementById("btnGuardar").textContent = "Guardar Cambios";
  
  document.getElementById("pNombre").value = p.nombre;
  document.getElementById("pPrecio").value = p.precio;
  document.getElementById("pDesc").value = p.descripcion || "";

  // Scroll al formulario
  document.getElementById("adminPanel").scrollTop = 0;
};

window.cancelarEdicion = () => {
  editingId = null;
  document.getElementById("formTitle").textContent = "Nuevo Producto";
  document.getElementById("btnGuardar").textContent = "Publicar Producto";
  document.getElementById("pNombre").value = "";
  document.getElementById("pPrecio").value = "";
  document.getElementById("pDesc").value = "";
  document.getElementById("pArchivo").value = "";
};

// ==================== GUARDAR (Crear o Editar) ====================
window.guardarProducto = async () => {
  const file = document.getElementById("pArchivo").files[0];
  const nombre = document.getElementById("pNombre").value.trim();
  const precio = document.getElementById("pPrecio").value;
  const descripcion = document.getElementById("pDesc").value.trim();

  if (!nombre || !precio) return alert("❌ Faltan datos");

  let imageUrl = null;

  if (file) {
    const fileName = Date.now() + "_" + file.name;
    const { error: uploadError } = await client.storage
      .from('imagenes_productos')
      .upload(fileName, file);

    if (uploadError) return alert("❌ Error al subir imagen: " + uploadError.message);

    const { data: urlData } = client.storage
      .from('imagenes_productos')
      .getPublicUrl(fileName);
    imageUrl = urlData.publicUrl;
  }

  if (editingId) {
    // === EDITAR ===
    const updateData = { nombre, precio: parseFloat(precio), descripcion };
    if (imageUrl) updateData.imgs = imageUrl;

    const { error } = await client
      .from('productos')
      .update(updateData)
      .eq('id', editingId);

    if (error) return alert("❌ Error al actualizar: " + error.message);

    alert("✅ Producto actualizado");
  } else {
    // === CREAR ===
    if (!file) return alert("❌ Debes subir una imagen para un producto nuevo");

    const { error } = await client
      .from('productos')
      .insert([{
        nombre,
        precio: parseFloat(precio),
        descripcion,
        imgs: imageUrl
      }]);

    if (error) return alert("❌ Error al guardar: " + error.message);

    alert("✅ Producto publicado");
  }

  cancelarEdicion();
  await cargarProductos();        // actualiza la lista global
  renderAdminProductos();         // actualiza la lista del admin
};

// ==================== ELIMINAR PRODUCTO ====================
window.eliminarProducto = async (id) => {
  if (!confirm("¿Seguro que quieres eliminar este producto?")) return;

  const { error } = await client
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) {
    alert("❌ Error al eliminar: " + error.message);
    return;
  }

  alert("✅ Producto eliminado");
  await cargarProductos();
  renderAdminProductos();
};

// ==================== CARRITO ====================
window.toggleCart = () => {
  const panel = document.getElementById("cartPanel");
  panel.classList.toggle("translate-x-full");
  
  // Pequeño efecto extra de suavidad
  if (!panel.classList.contains("translate-x-full")) {
    panel.style.boxShadow = "-10px 0 30px -10px rgb(249 115 22 / 0.3)";
  } else {
    panel.style.boxShadow = "";
  }
};

window.agregarAlCarrito = (id) => {
  const p = productos.find(prod => prod.id === id);
  if (p) {
    carrito.push(p);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarrito();
    mostrarToast("✅ Agregado al carrito");
  }
};

function actualizarCarrito() {
  document.getElementById("cartCount").textContent = carrito.length;
  renderCarrito();
}

function renderCarrito() {
  const container = document.getElementById("cartItems");
  let total = 0;

  if (carrito.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-zinc-400">
        <p class="text-xl">Tu carrito está vacío</p>
        <p class="text-sm mt-2">Agrega algunos gadgets premium 🔥</p>
      </div>`;
    document.getElementById("cartTotal").textContent = "$0";
    return;
  }

  container.innerHTML = carrito.map((p, i) => {
    total += Number(p.precio);
    return `
      <div class="flex gap-4 bg-zinc-800 p-4 rounded-2xl">
        <img src="${p.imgs}" class="w-16 h-16 object-cover rounded-xl">
        <div class="flex-1">
          <h4 class="font-bold">${p.nombre}</h4>
          <p class="text-orange-400">$${Number(p.precio).toLocaleString()}</p>
        </div>
        <button onclick="eliminarDelCarrito(${i})" class="text-red-500 hover:text-red-400">Eliminar</button>
      </div>`;
  }).join('');

  document.getElementById("cartTotal").textContent = "$" + total.toLocaleString();
}

window.eliminarDelCarrito = (i) => {
  carrito.splice(i, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
};

window.comprarPorWhatsApp = () => {
  if (carrito.length === 0) return alert("Carrito vacío");

  let total = carrito.reduce((acc, p) => acc + Number(p.precio), 0);
  let msg = `🛒 *Pedido TechStore*%0A%0A`;
  msg += carrito.map(p => `• ${p.nombre} - $${Number(p.precio).toLocaleString()}`).join("%0A");
  msg += `%0A%0A*Total: $${total.toLocaleString()}*`;

  // ←←← NÚMERO ACTUALIZADO AQUÍ
  window.open(`https://wa.me/573505555883?text=${msg}`, "_blank");
  
  carrito = [];
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
  toggleCart();
  mostrarToast("✅ Pedido enviado por WhatsApp");
};