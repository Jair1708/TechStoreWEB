let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;
let searchTerm = "";

// ====================== CARGAR PRODUCTOS ======================
async function cargarProductos() {
  const querySnapshot = await fb.getDocs(fb.collection(db, "productos"));
  productos = [];
  querySnapshot.forEach(doc => {
    productos.push({ id: doc.id, ...doc.data() });
  });
  renderCatalogo();
}

// ====================== NAVEGACIÓN ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

// ====================== LOGIN ======================
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");

window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  try {
    await signInWithEmailAndPassword(window.auth, email, pass);
    adminLoggeado = true;
    cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    mostrarToast("✅ Bienvenido al Panel Admin");
    cargarProductos();
  } catch (e) {
    alert("❌ Email o contraseña incorrectos");
  }
};

window.cerrarAdmin = function() {
  document.getElementById("adminPanel").classList.add("hidden");
  adminLoggeado = false;
};

// ====================== CARRITO ======================
window.toggleCart = function() {
  const panel = document.getElementById("carritoPanel");
  panel.classList.toggle("translate-x-full");
};

function actualizarCarrito() {
  const count = carrito.reduce((acc, item) => acc + (item.cantidad || 1), 0);
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
      <div class="flex gap-4 bg-zinc-800 p-5 rounded-3xl mb-4">
        <img src="${item.imgs?.[0]}" class="w-20 h-20 object-cover rounded-2xl">
        <div class="flex-1">
          <h4 class="font-semibold">${item.nombre}</h4>
          <p class="text-orange-400">$${new Intl.NumberFormat('es-CO').format(item.precio)}</p>
          <div class="flex items-center gap-4 mt-4">
            <button onclick="cambiarCantidad(${i}, -1)" class="w-9 h-9 bg-zinc-700 rounded-2xl">-</button>
            <span class="font-bold text-lg">${item.cantidad || 1}</span>
            <button onclick="cambiarCantidad(${i}, 1)" class="w-9 h-9 bg-zinc-700 rounded-2xl">+</button>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-xl">$${new Intl.NumberFormat('es-CO').format(subtotal)}</p>
          <button onclick="eliminarDelCarrito(${i})" class="text-red-500 mt-6 text-sm">Eliminar</button>
        </div>
      </div>`;
  }).join("");

  document.getElementById("subtotal").textContent = `$${new Intl.NumberFormat('es-CO').format(total)}`;
}

window.cambiarCantidad = function(i, delta) {
  carrito[i].cantidad = (carrito[i].cantidad || 1) + delta;
  if (carrito[i].cantidad < 1) carrito[i].cantidad = 1;
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  actualizarCarrito();
};

window.eliminarDelCarrito = function(i) {
  carrito.splice(i, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  actualizarCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return;
  let msg = "🛒 *Nuevo pedido TechStore*\n\n";
  carrito.forEach(item => {
    msg += `• ${item.cantidad || 1} × ${item.nombre}\n`;
  });
  const total = carrito.reduce((acc, item) => acc + item.precio * (item.cantidad || 1), 0);
  msg += `\n*Total: $${new Intl.NumberFormat('es-CO').format(total)}*`;
  window.open(`https://wa.me/573248777231?text=${encodeURIComponent(msg)}`, "_blank");
  carrito = [];
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
  actualizarCarrito();
  toggleCart();
};

// ====================== CATÁLOGO Y MODAL ======================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  const filtered = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  grid.innerHTML = filtered.map(p => `
    <div onclick="verProducto('${p.id}')" class="product-card bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer">
      <img src="${p.imgs?.[0] || ''}" class="w-full h-64 object-cover">
      <div class="p-5">
        <h3 class="font-semibold text-lg">${p.nombre}</h3>
        <p class="text-orange-400 text-3xl font-bold mt-2">$${new Intl.NumberFormat('es-CO').format(p.precio)}</p>
      </div>
    </div>
  `).join("") || `<p class="col-span-full text-center py-20 text-zinc-400">No se encontraron productos</p>`;
}

window.verProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  let currentIndex = 0;

  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
    <div class="p-8">
      <button onclick="document.getElementById('modal').classList.add('hidden')" class="float-right text-4xl leading-none">×</button>
      <img id="modalImg" src="${p.imgs[0]}" class="w-full rounded-3xl">
      <div class="flex justify-between mt-6 text-5xl">
        <button onclick="cambiarImagenModal(-1)" class="px-4">‹</button>
        <button onclick="cambiarImagenModal(1)" class="px-4">›</button>
      </div>
      <h2 class="text-3xl font-bold mt-8">${p.nombre}</h2>
      <p class="text-4xl font-bold text-orange-400 mt-3">$${new Intl.NumberFormat('es-CO').format(p.precio)}</p>
      <p class="mt-8 text-zinc-300 leading-relaxed">${p.descripcion || "Producto de alta calidad"}</p>
      <button onclick="agregarAlCarrito('${p.id}'); document.getElementById('modal').classList.add('hidden')" class="w-full mt-10 bg-orange-600 py-6 rounded-3xl text-xl font-semibold">🛒 Agregar al carrito</button>
    </div>
  `;
  document.getElementById("modal").classList.remove("hidden");

  window.cambiarImagenModal = function(dir) {
    currentIndex = (currentIndex + dir + p.imgs.length) % p.imgs.length;
    document.getElementById("modalImg").src = p.imgs[currentIndex];
  };
};

// ====================== TOAST ======================
function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastText").textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ====================== INICIO ======================
window.onload = function() {
  cargarProductos();
  actualizarCarrito();
  mostrarSeccion("inicio");

  // Búsqueda en tiempo real
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderCatalogo();
  });
};