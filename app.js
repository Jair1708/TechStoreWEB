// ====================== CONFIGURACIÓN SUPABASE ======================
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";     // ← CAMBIA ESTO
const SUPABASE_ANON_KEY = "eyJhbGciOi...";                  // ← CAMBIA ESTO (tu anon key)

const { createClient } = Supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==================================================================

let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let searchTerm = "";

// ====================== CARGAR PRODUCTOS ======================
async function cargarProductos() {
  const { data, error } = await supabase.from('productos').select('*');
  if (error) return console.error("Error cargando productos:", error);
  productos = data || [];
  renderCatalogo();
}

// ====================== NAVEGACIÓN ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const section = document.getElementById(id);
  if (section) section.classList.remove("hidden");
};

// ====================== LOGIN ======================
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    alert("❌ Email o contraseña incorrectos");
  } else {
    cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdmin();
    mostrarToast("✅ Bienvenido Admin");
  }
};

window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

// ====================== CARRITO ======================
window.toggleCart = function() {
  const panel = document.getElementById("carritoPanel");
  panel.classList.toggle("translate-x-full");
};

function actualizarCarrito() {
  const count = carrito.reduce((a, b) => a + (b.cantidad || 1), 0);
  document.getElementById("cartCount").textContent = count;
}

window.agregarAlCarrito = function(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;
  const existe = carrito.find(i => i.id === id);
  if (existe) existe.cantidad++;
  else carrito.push({ ...prod, cantidad: 1 });
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarrito();
  mostrarToast("✅ Agregado al carrito");
};

function renderCarrito() {
  const container = document.getElementById("carritoItems");
  let total = 0;
  container.innerHTML = carrito.map((item, i) => {
    const subtotal = item.precio * (item.cantidad || 1);
    total += subtotal;
    return `
      <div class="flex gap-4 bg-zinc-800 p-4 rounded-3xl mb-4">
        <img src="${item.imgs[0]}" class="w-20 h-20 object-cover rounded-2xl">
        <div class="flex-1">
          <h4>${item.nombre}</h4>
          <p class="text-orange-400">$${new Intl.NumberFormat('es-CO').format(item.precio)}</p>
        </div>
        <div class="text-right">
          <p class="font-bold">$${new Intl.NumberFormat('es-CO').format(subtotal)}</p>
          <button onclick="eliminarDelCarrito(${i})" class="text-red-500 text-sm mt-2">Eliminar</button>
        </div>
      </div>`;
  }).join("");
  document.getElementById("subtotal").innerHTML = `$${new Intl.NumberFormat('es-CO').format(total)}`;
}

window.eliminarDelCarrito = function(i) {
  carrito.splice(i, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  actualizarCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return;
  let msg = "🛒 *Pedido TechStore*\n\n";
  carrito.forEach(item => msg += `• ${item.cantidad || 1} × ${item.nombre}\n`);
  const total = carrito.reduce((a, b) => a + b.precio * (b.cantidad || 1), 0);
  msg += `\n*Total: $${new Intl.NumberFormat('es-CO').format(total)}*`;
  window.open(`https://wa.me/573248777231?text=${encodeURIComponent(msg)}`, "_blank");
  carrito = [];
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  actualizarCarrito();
  toggleCart();
};

// ====================== CATÁLOGO ======================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  const filtered = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  grid.innerHTML = filtered.map(p => `
    <div onclick="verProducto('${p.id}')" class="product-card bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer">
      <img src="${p.imgs[0]}" class="w-full h-64 object-cover">
      <div class="p-5">
        <h3 class="font-semibold text-lg">${p.nombre}</h3>
        <div class="flex items-baseline gap-3 mt-2">
          <span class="text-3xl font-bold">$${new Intl.NumberFormat('es-CO').format(p.precio)}</span>
          ${p.old ? `<span class="text-zinc-400 line-through text-sm">$${new Intl.NumberFormat('es-CO').format(p.old)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join("") || `<p class="text-center py-12 text-zinc-400 col-span-full">No hay productos aún</p>`;
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderCatalogo();
  });
}

// ====================== MODAL ======================
window.verProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  let index = 0;
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = `
    <div class="p-8">
      <button onclick="document.getElementById('modal').classList.add('hidden')" class="float-right text-4xl">×</button>
      <img id="modalImg" src="${p.imgs[0]}" class="w-full rounded-3xl mb-6">
      <div class="flex justify-between text-5xl mb-6">
        <button onclick="cambiarImg(-1)">‹</button>
        <button onclick="cambiarImg(1)">›</button>
      </div>
      <h2 class="text-3xl font-bold">${p.nombre}</h2>
      <div class="flex items-baseline gap-3 mt-3">
        <span class="text-4xl font-bold">$${new Intl.NumberFormat('es-CO').format(p.precio)}</span>
        ${p.old ? `<span class="text-zinc-400 line-through">$${new Intl.NumberFormat('es-CO').format(p.old)}</span>` : ''}
      </div>
      <p class="mt-6 text-zinc-300">${p.descripcion || ""}</p>
      <button onclick="agregarAlCarrito('${p.id}'); document.getElementById('modal').classList.add('hidden')" 
              class="w-full mt-8 bg-orange-600 py-6 rounded-3xl text-xl font-semibold">🛒 Agregar al carrito</button>
      <button onclick="comprarDirecto('${p.id}')" 
              class="w-full mt-3 bg-white text-black py-6 rounded-3xl text-xl font-semibold">📲 Comprar ahora por WhatsApp</button>
    </div>
  `;

  document.getElementById("modal").classList.remove("hidden");

  window.cambiarImg = function(dir) {
    index = (index + dir + p.imgs.length) % p.imgs.length;
    document.getElementById("modalImg").src = p.imgs[index];
  };
};

window.comprarDirecto = function(id) {
  const p = productos.find(x => x.id === id);
  const msg = `Quiero comprar: ${p.nombre} - $${new Intl.NumberFormat('es-CO').format(p.precio)}`;
  window.open(`https://wa.me/573248777231?text=${encodeURIComponent(msg)}`, "_blank");
  document.getElementById("modal").classList.add("hidden");
};

// ====================== ADMIN ======================
function renderAdmin() {
  const formHTML = `
    <h3 class="text-2xl font-bold mb-6">Agregar nuevo producto</h3>
    <input id="nombre" placeholder="Nombre" class="w-full mb-4 p-4 border rounded-3xl">
    <div class="grid grid-cols-2 gap-4">
      <input id="precio" type="number" placeholder="Precio" class="p-4 border rounded-3xl">
      <input id="old" type="number" placeholder="Precio anterior" class="p-4 border rounded-3xl">
    </div>
    <textarea id="descripcion" placeholder="Descripción" class="w-full mt-4 p-4 border rounded-3xl h-28"></textarea>
    <input id="fileInput" type="file" multiple accept="image/*" class="w-full mt-4 p-4 border rounded-3xl">
    <button onclick="agregarProductoAdmin()" class="w-full mt-6 bg-black text-white py-5 rounded-3xl">Agregar producto</button>
  `;
  document.getElementById("adminForm").innerHTML = formHTML;

  const listaHTML = productos.map(p => `
    <div class="flex justify-between items-center border-b py-4">
      <div>
        <img src="${p.imgs[0]}" class="w-12 h-12 object-cover rounded-xl inline-block mr-3">
        <span class="font-semibold">${p.nombre}</span>
      </div>
      <div>
        <button onclick="editarProducto('${p.id}')" class="text-blue-600 mr-4">Editar</button>
        <button onclick="eliminarProducto('${p.id}')" class="text-red-600">Eliminar</button>
      </div>
    </div>`).join("");
  document.getElementById("listaAdmin").innerHTML = `<h3 class="font-bold mb-4">Productos (${productos.length})</h3>` + listaHTML;
}

async function agregarProductoAdmin() {
  const files = document.getElementById("fileInput").files;
  if (files.length === 0) return alert("Sube al menos una foto");

  const imgs = [];
  for (let file of files) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
    if (uploadError) return alert("Error al subir imagen");

    const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName);
    imgs.push(urlData.publicUrl);
  }

  const nuevo = {
    nombre: document.getElementById("nombre").value,
    precio: Number(document.getElementById("precio").value),
    old: Number(document.getElementById("old").value) || null,
    descripcion: document.getElementById("descripcion").value,
    imgs: imgs
  };

  const { error } = await supabase.from('productos').insert(nuevo);
  if (error) alert(error.message);
  else {
    mostrarToast("✅ Producto agregado");
    cargarProductos();
    renderAdmin();
  }
}

window.eliminarProducto = async function(id) {
  if (confirm("¿Eliminar este producto?")) {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (!error) {
      cargarProductos();
      renderAdmin();
    }
  }
};

window.editarProducto = function(id) {
  alert("🚧 Editar en desarrollo (por ahora elimina y crea de nuevo)");
};

// ====================== TOAST ======================
function mostrarToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

// ====================== INICIO ======================
window.onload = function() {
  cargarProductos();
  actualizarCarrito();
  initSearch();
};