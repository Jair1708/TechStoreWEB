// ====================== DATA ======================
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;

// ====================== UTILIDADES ======================
function saveData() {
  localStorage.setItem("productos", JSON.stringify(productos));
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarToast(mensaje) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  document.getElementById("toastText").innerHTML = mensaje;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ====================== SECCIONES ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  if (id === 'catalogo') renderCatalogo();
}

// ====================== SLIDER ======================
let currentSlide = 0;
const sliderData = [
  { emoji: "🔥", title: "SUPER OFERTAS", subtitle: "Hasta 50% OFF", bg: "from-orange-600 via-red-600 to-pink-600" },
  { emoji: "🚀", title: "PRODUCTOS VIRALES", subtitle: "Lo más vendido en Colombia", bg: "from-blue-600 via-cyan-500 to-teal-500" },
  { emoji: "🇨🇴", title: "ENVÍO RÁPIDO", subtitle: "24-72 horas a todo Colombia", bg: "from-emerald-600 via-teal-600 to-cyan-600" }
];

function renderSlider() {
  const slidesContainer = document.getElementById("slides");
  const dotsContainer = document.getElementById("dots");
  if (!slidesContainer || !dotsContainer) return;
  
  slidesContainer.innerHTML = sliderData.map((slide, i) => `
    <div class="slide bg-gradient-to-r ${slide.bg}">
      <div class="text-center">
        <div class="text-8xl mb-6">${slide.emoji}</div>
        <h2 class="text-6xl font-bold mb-4">${slide.title}</h2>
        <p class="text-2xl">${slide.subtitle}</p>
      </div>
    </div>
  `).join("");
  
  dotsContainer.innerHTML = sliderData.map((_, i) => `
    <button onclick="goToSlide(${i})" class="w-3 h-3 rounded-full ${i === 0 ? 'bg-orange-500' : 'bg-white/30'} transition-all"></button>
  `).join("");
  
  autoSlide();
}

function renderDots() {
  document.querySelectorAll("#dots button").forEach((btn, i) => {
    btn.className = `w-3 h-3 rounded-full ${i === currentSlide ? 'bg-orange-500' : 'bg-white/30'} transition-all`;
  });
}

window.goToSlide = function(n) {
  currentSlide = n;
  const slidesEl = document.getElementById("slides");
  if (slidesEl) slidesEl.style.transform = `translateX(-${n * 100}%)`;
  renderDots();
};

window.nextSlide = function() {
  currentSlide = (currentSlide + 1) % sliderData.length;
  goToSlide(currentSlide);
};

window.prevSlide = function() {
  currentSlide = (currentSlide - 1 + sliderData.length) % sliderData.length;
  goToSlide(currentSlide);
};

let slideInterval;
function autoSlide() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}

// ====================== CATALOGO ======================
let filtroActual = "Todos";

window.renderFiltros = function()
  const filtrosContainer = document.getElementById("filtros");
  if (!filtrosContainer) return;
  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];
  
  filtrosContainer.innerHTML = categorias.map(cat => `
    <button onclick="filtrarCategoria('${cat}')" class="px-6 py-3 rounded-3xl font-medium transition-all ${filtroActual === cat ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}">
      ${cat}
    </button>
  `).join("");
}

window.filtrarCategoria = function(categoria) {
  filtroActual = categoria;
  renderFiltros();
  renderCatalogo();
};

window.renderCatalogo = function()
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  
  let filtrados = productos.filter(p => {
    const matchCategoria = filtroActual === "Todos" || p.categoria === filtroActual;
    const matchBusqueda = p.nombre.toLowerCase().includes(search);
    return matchCategoria && matchBusqueda;
  });
  
  grid.innerHTML = filtrados.map(p => `
    <div class="product-card bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer" onclick="verProducto(${p.id})">
      <div class="relative overflow-hidden h-48">
        <img src="${p.imgs[0]}" class="w-full h-full object-cover hover:scale-110 transition-transform duration-300">
        <div class="absolute top-3 right-3 bg-orange-600 text-white px-4 py-2 rounded-3xl text-sm font-bold">
          -${Math.round((1 - p.precio / p.old) * 100)}%
        </div>
      </div>
      <div class="p-6">
        <h3 class="font-semibold mb-2 line-clamp-2">${p.nombre}</h3>
        <p class="text-zinc-400 text-sm mb-4">${p.descripcion}</p>
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl font-bold text-orange-500">$${p.precio.toLocaleString()}</span>
          <span class="text-sm text-zinc-500 line-through">$${p.old.toLocaleString()}</span>
        </div>
        <button onclick="event.stopPropagation(); agregarAlCarrito(${p.id})" class="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-2xl font-bold transition-colors">
          AGREGAR AL CARRITO
        </button>
      </div>
    </div>
  `).join("");
}

// ====================== MODAL ======================
window.verProducto = function(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  if (!modal || !content) return;
  
  content.innerHTML = `
    <div class="flex flex-col md:flex-row gap-8 p-8">
      <div class="flex-1">
        <img id="modalImage" src="${producto.imgs[0]}" class="w-full rounded-3xl mb-4">
        <div class="flex gap-2 overflow-x-auto">
          ${producto.imgs.map((img, i) => `
            <img src="${img}" onclick="cambiarImagenModal(${i})" class="w-20 h-20 rounded-2xl cursor-pointer hover:opacity-70 transition-opacity">
          `).join("")}
        </div>
      </div>
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <h2 class="text-4xl font-bold mb-4">${producto.nombre}</h2>
          <div class="flex items-center gap-4 mb-6">
            <span class="text-5xl font-bold text-orange-500">$${producto.precio.toLocaleString()}</span>
            <span class="text-2xl text-zinc-500 line-through">$${producto.old.toLocaleString()}</span>
          </div>
          <div class="bg-orange-600/20 border border-orange-600 rounded-3xl p-4 mb-6">
            <p class="text-orange-400 font-bold">Ahorra: $${(producto.old - producto.precio).toLocaleString()}</p>
          </div>
          <p class="text-xl text-zinc-300 mb-8">${producto.descripcion}</p>
        </div>
        <div class="flex gap-4">
          <button onclick="agregarAlCarrito(${producto.id}); cerrarModal(); mostrarToast('✅ Agregado al carrito')" class="flex-1 bg-orange-600 hover:bg-orange-500 py-4 rounded-3xl font-bold text-lg transition-colors">
            AGREGAR AL CARRITO
          </button>
          <button onclick="cerrarModal()" class="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-3xl font-bold transition-colors">
            CERRAR
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.remove("hidden");
};

window.cerrarModal = function() {
  document.getElementById("modal").classList.add("hidden");
};

window.cambiarImagenModal = function(i) {
  const modalImage = document.getElementById("modalImage");
  if (modalImage) {
    const titulo = document.querySelector("#modalContent h2")?.textContent || "";
    // no automatic cross-lookup to avoid errors, keep simple
    modalImage.src = document.querySelectorAll("#modalContent img")[i]?.src || modalImage.src;
  }
};

// ====================== CARRITO ======================
window.agregarAlCarrito = function(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;
  const existe = carrito.find(p => p.id === id);
  
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  
  saveData();
  actualizarCarrito();
  mostrarToast(`✅ ${producto.nombre} agregado`);
};

function actualizarCarrito() {
  const total = carrito.reduce((a, p) => a + (p.cantidad || 0), 0);
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) cartCountEl.innerText = total;
  
  const container = document.getElementById("carritoItems");
  let subtotal = 0;
  
  if (!container) return;
  if (carrito.length === 0) {
    container.innerHTML = '<p class="text-center text-zinc-400 py-8">Tu carrito está vacío</p>';
  } else {
    container.innerHTML = carrito.map((p, i) => {
      subtotal += p.precio * (p.cantidad || 0);
      return `
        <div class="bg-zinc-800 p-4 rounded-2xl">
          <div class="flex gap-4 mb-3">
            <img src="${p.imgs[0]}" class="w-16 h-16 rounded-xl object-cover">
            <div class="flex-1">
              <h4 class="font-semibold mb-1">${p.nombre}</h4>
              <p class="text-orange-500 font-bold">$${p.precio.toLocaleString()}</p>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 bg-zinc-900 rounded-xl px-3 py-2">
              <button onclick="cambiarCantidad(${i}, -1)" class="text-orange-500 font-bold">−</button>
              <span class="w-6 text-center">${p.cantidad}</span>
              <button onclick="cambiarCantidad(${i}, 1)" class="text-orange-500 font-bold">+</button>
            </div>
            <button onclick="eliminarDelCarrito(${i})" class="text-red-500 hover:text-red-400 font-bold">✕</button>
          </div>
        </div>
      `;
    }).join("");
  }
  
  const subtotalEl = document.getElementById("subtotal");
  if (subtotalEl) subtotalEl.innerText = "$" + subtotal.toLocaleString();
}

window.cambiarCantidad = function(index, cambio) {
  if (carrito[index]) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
      eliminarDelCarrito(index);
    } else {
      saveData();
      actualizarCarrito();
    }
  }
};

window.eliminarDelCarrito = function(index) {
  carrito.splice(index, 1);
  saveData();
  actualizarCarrito();
  mostrarToast("❌ Producto removido");
};

window.toggleCart = function() {
  const panel = document.getElementById("carritoPanel");
  if (panel) panel.classList.toggle("translate-x-full");
  actualizarCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) {
    mostrarToast("⚠️ Tu carrito está vacío");
    return;
  }
  
  let mensaje = "🛒 *Mi pedido de TechStore:*\n\n";
  let total = 0;
  
  carrito.forEach(p => {
    mensaje += `✓ ${p.nombre}\n   Cantidad: ${p.cantidad} x $${p.precio.toLocaleString()}\n`;
    total += p.precio * p.cantidad;
  });
  
  mensaje += `\n*Total: $${total.toLocaleString()}*\n*Envío: GRATIS*\n\n¿Listo para procesar mi compra?`;
  
  window.open(`https://wa.me/573248777231?text=${encodeURIComponent(mensaje)}`);
};

// ====================== LOGIN & ADMIN - PROTEGIDO ======================
window.abrirLogin = function() {
  const box = document.getElementById("loginBox");
  if (box) box.classList.remove("hidden");
};

window.cerrarLogin = function() {
  const box = document.getElementById("loginBox");
  if (box) box.classList.add("hidden");
};

window.login = function() {
  const user = document.getElementById("user")?.value || "";
  const pass = document.getElementById("pass")?.value || "";
  
  // Credenciales: admin / techstore2026
  if (user === "admin" && pass === "techstore2026") {
    adminLoggeado = true;
    cerrarLogin();
    const panel = document.getElementById("adminPanel");
    if (panel) panel.classList.remove("hidden");
    renderAdmin();
    mostrarToast("✅ Bienvenido Admin");
  } else {
    mostrarToast("❌ Credenciales incorrectas");
  }
};

window.cerrarAdmin = function() {
  adminLoggeado = false;
  const panel = document.getElementById("adminPanel");
  if (panel) panel.classList.add("hidden");
  const form = document.getElementById("adminForm");
  const lista = document.getElementById("listaAdmin");
  if (form) form.innerHTML = "";
  if (lista) lista.innerHTML = "";
  const contador = document.getElementById("contadorAdmin");
  if (contador) contador.innerText = "0";
};

function renderAdmin() {
  if (!adminLoggeado) return;
  
  const form = document.getElementById("adminForm");
  const lista = document.getElementById("listaAdmin");
  if (!form || !lista) return;
  
  form.innerHTML = `
    <h3 class="text-2xl font-bold mb-6">Agregar Producto</h3>
    <input id="newNombre" placeholder="Nombre" class="w-full mb-3 px-4 py-3 bg-zinc-800 rounded-xl text-white border border-zinc-700 focus:border-orange-500">
    <input id="newPrecio" type="number" placeholder="Precio" class="w-full mb-3 px-4 py-3 bg-zinc-800 rounded-xl text-white border border-zinc-700 focus:border-orange-500">
    <input id="newOld" type="number" placeholder="Precio anterior" class="w-full mb-3 px-4 py-3 bg-zinc-800 rounded-xl text-white border border-zinc-700 focus:border-orange-500">
    <input id="newDesc" placeholder="Descripción" class="w-full mb-3 px-4 py-3 bg-zinc-800 rounded-xl text-white border border-zinc-700 focus:border-orange-500">
    <input id="newCat" placeholder="Categoría" class="w-full mb-3 px-4 py-3 bg-zinc-800 rounded-xl text-white border border-zinc-700 focus:border-orange-500">
    <input id="newImg" placeholder="URL Imagen" class="w-full mb-6 px-4 py-3 bg-zinc-800 rounded-xl text-white border border-zinc-700 focus:border-orange-500">
    <button onclick="agregarProducto()" class="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold transition-colors">
      AGREGAR PRODUCTO
    </button>
  `;
  
  const contador = document.getElementById("contadorAdmin");
  if (contador) contador.innerText = productos.length;
  
  lista.innerHTML = productos.map((p, i) => `
    <div class="bg-zinc-800 p-4 rounded-xl flex justify-between items-start">
      <div class="flex-1">
        <h4 class="font-bold mb-2">${p.nombre}</h4>
        <p class="text-sm text-zinc-400 mb-2">$${p.precio.toLocaleString()} (antes $${p.old.toLocaleString()})</p>
        <p class="text-xs text-zinc-500">${p.categoria}</p>
      </div>
      <button onclick="eliminarProducto(${i})" class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-bold transition-colors">
        ELIMINAR
      </button>
    </div>
  `).join("");
}

window.agregarProducto = function() {
  if (!adminLoggeado) {
    mostrarToast("❌ No tienes permiso");
    return;
  }
  
  const nombre = document.getElementById("newNombre")?.value || "";
  const precio = parseInt(document.getElementById("newPrecio")?.value || "0");
  const old = parseInt(document.getElementById("newOld")?.value || "0");
  const desc = document.getElementById("newDesc")?.value || "";
  const cat = document.getElementById("newCat")?.value || "";
  const img = document.getElementById("newImg")?.value || "";
  
  if (!nombre || !precio || !old || !desc || !cat || !img) {
    mostrarToast("⚠️ Completa todos los campos");
    return;
  }
  
  productos.push({
    id: productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1,
    nombre, precio, old, descripcion: desc, categoria: cat, imgs: [img]
  });
  
  saveData();
  renderAdmin();
  mostrarToast("✅ Producto agregado");
  
  const fields = ["newNombre","newPrecio","newOld","newDesc","newCat","newImg"];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
};

window.eliminarProducto = function(index) {
  if (!adminLoggeado) {
    mostrarToast("❌ No tienes permiso");
    return;
  }
  
  if (confirm("¿Eliminar este producto?")) {
    productos.splice(index, 1);
    saveData();
    renderAdmin();
    mostrarToast("✅ Producto eliminado");
  }
};

// ====================== MENÚ MÓVIL ======================
window.toggleMobileMenu = function() {
  const menu = document.getElementById("mobileMenu");
  const icon = document.getElementById("mobileIcon");
  if (menu) menu.classList.toggle("hidden");
  if (icon) { icon.classList.toggle("fa-bars"); icon.classList.toggle("fa-times"); }
};

// ====================== INICIO ======================
function init() {
  renderSlider();
  renderFiltros();
  renderCatalogo();
  mostrarSeccion("inicio");
  
  // PANEL ADMIN NO SE LLENA AL INICIAR. Solo con login.
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", renderCatalogo);
  }
  
  console.log('%c✅ TechStore 2026 - Panel Admin PROTEGIDO 🔒', 'color:#ff5e00; font-weight:bold; font-size:16px');
}

window.addEventListener("load", init);