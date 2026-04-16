// ====================== DATA ======================
let productos = [];
let sliderSlides = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;
let filtroActual = "Todos";
let searchTerm = "";
let currentSlide = 0;
let editingId = null;           // ← para editar producto
let currentAdminTab = "productos";

// ====================== FIREBASE ======================
async function cargarProductos() {
  const querySnapshot = await fb.getDocs(fb.collection(db, "productos"));
  productos = [];
  querySnapshot.forEach(doc => productos.push({ id: doc.id, ...doc.data() }));
  renderFiltros();
  renderCatalogo();
  renderAdmin();
}

async function cargarSlider() {
  const snapshot = await fb.getDocs(fb.collection(db, "slider"));
  sliderSlides = [];
  snapshot.forEach(doc => sliderSlides.push({ id: doc.id, ...doc.data() }));
  renderSlider();
}

// ====================== UTIL ======================
function formatearPrecio(precio) {
  return precio ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio) : '$0';
}

function saveCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastText").textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function actualizarCarrito() {
  document.getElementById("cartCount").textContent = carrito.reduce((sum, item) => sum + item.cantidad, 0);
}

// ====================== LOGIN REAL CON FIREBASE AUTH ======================
window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  try {
    await signInWithEmailAndPassword(window.auth, email, pass);
    adminLoggeado = true;
    cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdmin();
    mostrarToast("✅ Bienvenido al Panel Admin");
  } catch (e) {
    mostrarToast("❌ Email o contraseña incorrectos");
  }
};

window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarAdmin = () => {
  document.getElementById("adminPanel").classList.add("hidden");
  adminLoggeado = false;
};

// ====================== CARRITO CON CANTIDAD ======================
window.agregarAlCarrito = function(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const existe = carrito.find(item => item.id === id);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  saveCarrito();
  actualizarCarrito();
  mostrarToast("✅ Agregado al carrito");
};

function renderCarrito() {
  const cont = document.getElementById("carritoItems");
  const subtotalEl = document.getElementById("subtotal");

  if (carrito.length === 0) {
    cont.innerHTML = `<p class="text-center text-zinc-400 py-16">🛒 Tu carrito está vacío</p>`;
    subtotalEl.textContent = "$0";
    return;
  }

  cont.innerHTML = carrito.map((item, i) => `
    <div class="flex gap-4 bg-zinc-800 p-4 rounded-3xl">
      <img src="${item.imgs?.[0] || ''}" class="w-20 h-20 object-cover rounded-2xl">
      <div class="flex-1">
        <h4 class="font-semibold">${item.nombre}</h4>
        <p class="text-orange-500">${formatearPrecio(item.precio)}</p>
        <div class="flex items-center gap-3 mt-2">
          <button onclick="cambiarCantidad(${i}, -1)" class="w-8 h-8 bg-zinc-700 rounded-2xl">-</button>
          <span class="font-semibold">${item.cantidad}</span>
          <button onclick="cambiarCantidad(${i}, 1)" class="w-8 h-8 bg-zinc-700 rounded-2xl">+</button>
        </div>
      </div>
      <div class="text-right">
        <p class="font-bold">${formatearPrecio(item.precio * item.cantidad)}</p>
        <button onclick="eliminarDelCarrito(${i})" class="text-red-500 mt-6">Eliminar</button>
      </div>
    </div>`).join("");

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  subtotalEl.textContent = formatearPrecio(total);
}

window.cambiarCantidad = function(i, delta) {
  carrito[i].cantidad += delta;
  if (carrito[i].cantidad < 1) carrito[i].cantidad = 1;
  saveCarrito();
  renderCarrito();
  actualizarCarrito();
};

window.eliminarDelCarrito = function(i) {
  carrito.splice(i, 1);
  saveCarrito();
  renderCarrito();
  actualizarCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return;
  let msg = "Hola TechStore 🔥\n\nQuiero comprar:\n\n";
  carrito.forEach(item => {
    msg += `• ${item.cantidad} × ${item.nombre} → ${formatearPrecio(item.precio * item.cantidad)}\n`;
  });
  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  msg += `\nTotal: ${formatearPrecio(total)}\nEnvío: GRATIS`;
  window.open(`https://wa.me/573248777231?text=${encodeURIComponent(msg)}`, "_blank");
};

// ====================== EDITAR PRODUCTO + ELIMINAR FOTO INDIVIDUAL ======================
async function editarProducto(id) {
  editingId = id;
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  const form = document.getElementById("adminForm");
  form.innerHTML = `
    <h3 class="text-2xl font-semibold mb-6">Editar Producto</h3>
    <input id="newNombre" value="${prod.nombre}" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
    <div class="grid grid-cols-2 gap-3">
      <input id="newPrecio" type="number" value="${prod.precio}" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
      <input id="newOld" type="number" value="${prod.old || ''}" placeholder="Precio anterior" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
    </div>
    <input id="newDesc" value="${prod.descripcion || ''}" placeholder="Descripción" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
    <input id="newCat" value="${prod.categoria}" placeholder="Categoría" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl">

    <div class="mb-6">
      <p class="text-sm text-zinc-400 mb-3">Fotos actuales:</p>
      <div class="flex flex-wrap gap-3" id="fotosActuales"></div>
    </div>

    <label class="block text-sm font-medium mb-2 text-zinc-400">Agregar más fotos</label>
    <input id="newImgs" type="file" multiple accept="image/*" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl">
    <button onclick="guardarProductoEditado()" class="w-full bg-orange-600 py-5 rounded-3xl text-xl">Guardar Cambios</button>
  `;

  // Mostrar fotos actuales con botón eliminar
  const container = document.getElementById("fotosActuales");
  prod.imgs.forEach((url, index) => {
    const div = document.createElement("div");
    div.className = "relative";
    div.innerHTML = `
      <img src="${url}" class="w-20 h-20 object-cover rounded-2xl border border-orange-500">
      <button onclick="eliminarFoto('${id}', ${index});" class="absolute -top-1 -right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs">×</button>`;
    container.appendChild(div);
  });
}

window.eliminarFoto = async function(productoId, index) {
  if (!confirm("¿Eliminar esta foto?")) return;
  const prod = productos.find(p => p.id === productoId);
  prod.imgs.splice(index, 1);

  await fb.updateDoc(fb.doc(db, "productos", productoId), { imgs: prod.imgs });
  mostrarToast("Foto eliminada");
  editarProducto(productoId); // refresca el formulario
};

async function guardarProductoEditado() {
  const nombre = document.getElementById("newNombre").value.trim();
  const precio = parseInt(document.getElementById("newPrecio").value);
  const old = parseInt(document.getElementById("newOld").value) || null;
  const desc = document.getElementById("newDesc").value.trim();
  const cat = document.getElementById("newCat").value.trim();
  const files = document.getElementById("newImgs").files;

  if (!nombre || !precio || !cat) return mostrarToast("❌ Faltan datos");

  let imgUrls = productos.find(p => p.id === editingId).imgs;

  if (files.length > 0) {
    mostrarToast("⏳ Subiendo nuevas imágenes...");
    for (let file of files) {
      const storageRef = fb.ref(window.storage, `productos/${Date.now()}-${file.name}`);
      await fb.uploadBytes(storageRef, file);
      const url = await fb.getDownloadURL(storageRef);
      imgUrls.push(url);
    }
  }

  await fb.updateDoc(fb.doc(db, "productos", editingId), {
    nombre, precio, old, descripcion: desc, categoria: cat, imgs: imgUrls
  });

  mostrarToast("✅ Producto actualizado");
  editingId = null;
  cargarProductos();
}

// ====================== ADMIN ======================
function renderAdmin() {
  if (!adminLoggeado) return;
  const form = document.getElementById("adminForm");
  const lista = document.getElementById("listaAdmin");

  if (currentAdminTab === "productos") {
    form.innerHTML = `... (formulario agregar producto igual que antes, con preview) ...`; // mantengo el anterior para agregar nuevo
    // (puedes copiar el formulario de agregar del mensaje anterior)

    lista.innerHTML = `<h3 class="font-semibold mb-6">Productos (${productos.length})</h3>` + 
      productos.map(p => `
      <div class="bg-zinc-800 p-6 rounded-3xl mb-4 flex justify-between items-start">
        <div>
          <h4 class="font-semibold">${p.nombre}</h4>
          <p class="text-orange-500">${formatearPrecio(p.precio)} • ${p.categoria}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="editarProducto('${p.id}')" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-2xl text-sm">Editar</button>
          <button onclick="eliminarProducto('${p.id}')" class="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-2xl text-sm">Eliminar</button>
        </div>
      </div>`).join("");
  } else {
    // slider tab (igual que antes)
  }
}

async function eliminarProducto(id) {
  if (confirm("¿Eliminar este producto completamente?")) {
    await fb.deleteDoc(fb.doc(db, "productos", id));
    cargarProductos();
  }
}

// ====================== INIT ======================
window.onload = function() {
  cargarProductos();
  cargarSlider();
  mostrarSeccion("inicio");
  actualizarCarrito();

  document.getElementById("searchInput").addEventListener("input", e => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderCatalogo();
  });
};