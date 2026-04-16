// ====================== DATA ======================
let productos = [];
let sliderSlides = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;
let filtroActual = "Todos";
let searchTerm = "";
let currentSlide = 0;
let currentAdminTab = "productos";
let productoActual = null;
let modalIndex = 0;

// ====================== FIREBASE ======================
async function cargarProductos() {
  try {
    const querySnapshot = await fb.getDocs(fb.collection(db, "productos"));
    productos = [];
    querySnapshot.forEach(docu => productos.push({ id: docu.id, ...docu.data() }));
    renderFiltros();
    renderCatalogo();
    renderAdmin();
  } catch (e) { console.error(e); }
}

async function cargarSlider() {
  try {
    const snapshot = await fb.getDocs(fb.collection(db, "slider"));
    sliderSlides = [];
    snapshot.forEach(doc => sliderSlides.push({ id: doc.id, ...doc.data() }));
    sliderSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
    renderSlider();
  } catch (e) { console.error(e); }
}

// ====================== UTIL ======================
function saveCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  const text = document.getElementById("toastText");
  text.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function actualizarCarrito() {
  document.getElementById("cartCount").textContent = carrito.length;
}

// ====================== SECCIONES ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
};

// ====================== SLIDER (AHORA EDITABLE) ======================
function renderSlider() {
  const slidesCont = document.getElementById("slides");
  const dotsCont = document.getElementById("dots");

  slidesCont.innerHTML = sliderSlides.map(slide => `
    <div class="slide flex-shrink-0 w-full h-full bg-cover bg-center flex items-center relative" style="background-image: url('${slide.img}')">
      <div class="max-w-7xl mx-auto px-6 relative z-10 text-white">
        <h2 class="text-5xl lg:text-7xl font-bold logo-font tracking-tighter">${slide.title}</h2>
        <p class="text-3xl mt-4">${slide.subtitle}</p>
        <button onclick="mostrarSeccion('catalogo')" class="mt-8 bg-orange-600 hover:bg-orange-500 px-10 py-5 rounded-3xl text-xl font-semibold flex items-center gap-3">
          Ver productos <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>`).join("");

  dotsCont.innerHTML = sliderSlides.map((_, i) => `
    <button onclick="goToSlide(${i})" class="w-4 h-4 rounded-full transition-all ${i === 0 ? 'bg-orange-500 scale-125' : 'bg-white/50 hover:bg-white'}"></button>`).join("");
}

window.prevSlide = () => { currentSlide = (currentSlide - 1 + sliderSlides.length) % sliderSlides.length; updateSlider(); };
window.nextSlide = () => { currentSlide = (currentSlide + 1) % sliderSlides.length; updateSlider(); };
window.goToSlide = (i) => { currentSlide = i; updateSlider(); };

function updateSlider() {
  document.getElementById("slides").style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll("#dots button").forEach((dot, i) => {
    dot.classList.toggle("bg-orange-500", i === currentSlide);
    dot.classList.toggle("scale-125", i === currentSlide);
  });
}

// ====================== LOGIN ======================
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");

window.login = function() {
  if (document.getElementById("user").value === "admin" && document.getElementById("pass").value === "1234") {
    adminLoggeado = true;
    cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdmin();
    mostrarToast("✅ Bienvenido al Panel Admin");
  } else mostrarToast("❌ Credenciales incorrectas");
};

window.cerrarAdmin = () => {
  document.getElementById("adminPanel").classList.add("hidden");
  adminLoggeado = false;
};

window.cambiarTabAdmin = function(tab) {
  currentAdminTab = tab;
  renderAdmin();
};

// ====================== CARRITO ======================
window.toggleCart = function() {
  const panel = document.getElementById("carritoPanel");
  if (panel.classList.contains("translate-x-full")) {
    panel.classList.remove("translate-x-full");
    renderCarrito();
  } else panel.classList.add("translate-x-full");
};

function renderCarrito() {
  const cont = document.getElementById("carritoItems");
  const subtotalEl = document.getElementById("subtotal");

  if (carrito.length === 0) {
    cont.innerHTML = `<p class="text-center text-zinc-400 py-16 text-xl">🛒 Tu carrito está vacío</p>`;
    subtotalEl.textContent = "$0";
    return;
  }

  cont.innerHTML = carrito.map((p, i) => `
    <div class="flex gap-4 bg-zinc-800 p-4 rounded-3xl">
      <img src="${p.imgs?.[0] || ''}" class="w-20 h-20 object-cover rounded-2xl">
      <div class="flex-1"><h4>${p.nombre}</h4><p class="text-orange-500">$${p.precio}</p></div>
      <button onclick="eliminarDelCarrito(${i});" class="text-3xl text-red-500">×</button>
    </div>`).join("");

  const total = carrito.reduce((sum, p) => sum + p.precio, 0);
  subtotalEl.textContent = `$${total}`;
}

window.eliminarDelCarrito = function(i) {
  carrito.splice(i, 1);
  saveCarrito();
  renderCarrito();
  actualizarCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return;
  let msg = "Hola TechStore!\n\nQuiero comprar:\n";
  carrito.forEach(p => msg += `• ${p.nombre} - $${p.precio}\n`);
  msg += `\nTotal: $${carrito.reduce((a,p)=>a+p.precio,0)}\nEnvío GRATIS`;
  window.open(`https://wa.me/573248777231?text=${encodeURIComponent(msg)}`, "_blank");
};

// ====================== FILTROS Y CATÁLOGO ======================
function renderFiltros() {
  const cont = document.getElementById("filtros");
  const cats = ["Todos", ...new Set(productos.map(p => p.categoria))];
  cont.innerHTML = cats.map(cat => `
    <button onclick="filtrarCategoria('${cat}')" class="px-6 py-3 rounded-3xl text-sm ${cat === filtroActual ? 'bg-orange-500' : 'bg-zinc-800 hover:bg-zinc-700'}">
      ${cat}
    </button>`).join("");
}

window.filtrarCategoria = function(cat) {
  filtroActual = cat;
  renderFiltros();
  renderCatalogo();
};

function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  let lista = productos.filter(p => filtroActual === "Todos" || p.categoria === filtroActual);
  if (searchTerm) lista = lista.filter(p => p.nombre.toLowerCase().includes(searchTerm));

  grid.innerHTML = lista.map(p => `
    <div onclick="mostrarDetalleProducto('${p.id}')" class="product-card bg-zinc-900 p-5 rounded-3xl cursor-pointer">
      <div class="relative">
        <img src="${p.imgs?.[0] || ''}" class="w-full aspect-square object-cover rounded-2xl">
        ${p.imgs && p.imgs.length > 1 ? `<div class="absolute top-3 right-3 bg-black/70 px-3 py-1 text-xs rounded-2xl">${p.imgs.length} fotos</div>` : ''}
      </div>
      <h3 class="font-semibold text-lg mt-4">${p.nombre}</h3>
      <div class="flex gap-2 mt-2">
        ${p.old ? `<span class="line-through text-zinc-500">$${p.old}</span>` : ''}
        <span class="text-3xl font-bold text-orange-500">$${p.precio}</span>
      </div>
      <button onclick="event.stopImmediatePropagation();agregarAlCarrito('${p.id}')" class="mt-6 w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-3xl font-semibold">Agregar</button>
    </div>`).join("");
}

window.agregarAlCarrito = function(id) {
  const prod = productos.find(p => p.id === id);
  if (prod) {
    carrito.push(prod);
    saveCarrito();
    actualizarCarrito();
    mostrarToast("✅ Agregado al carrito");
  }
};

// ====================== MODAL DETALLE ======================
window.mostrarDetalleProducto = function(id) {
  productoActual = productos.find(p => p.id === id);
  if (!productoActual) return;

  const content = document.getElementById("modalContent");
  let slidesHTML = productoActual.imgs.map(url => `
    <div class="slide-modal min-w-full h-96 bg-cover bg-center" style="background-image:url('${url}')"></div>`).join("");

  content.innerHTML = `
    <div class="p-8">
      <button onclick="cerrarModal()" class="float-right text-4xl">×</button>
      <div class="relative overflow-hidden rounded-3xl mb-8" style="height:380px">
        <div id="modalSlides" class="flex h-full transition-transform duration-700">${slidesHTML}</div>
        ${productoActual.imgs.length > 1 ? `
        <button onclick="modalPrev()" class="absolute left-4 top-1/2 bg-black/70 hover:bg-black text-4xl w-12 h-12 rounded-3xl">‹</button>
        <button onclick="modalNext()" class="absolute right-4 top-1/2 bg-black/70 hover:bg-black text-4xl w-12 h-12 rounded-3xl">›</button>` : ''}
      </div>
      <h2 class="text-4xl font-bold">${productoActual.nombre}</h2>
      <p class="text-5xl text-orange-500 font-bold mt-2">$${productoActual.precio}</p>
      <p class="mt-6 text-zinc-400">${productoActual.descripcion || ""}</p>
      <button onclick="agregarAlCarrito('${productoActual.id}');cerrarModal()" class="mt-10 w-full bg-orange-600 py-6 rounded-3xl text-2xl font-semibold">Agregar al carrito</button>
    </div>`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal").classList.add("flex");
};

window.cerrarModal = function() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
};

window.modalPrev = () => {
  if (!productoActual) return;
  modalIndex = (modalIndex - 1 + productoActual.imgs.length) % productoActual.imgs.length;
  document.getElementById("modalSlides").style.transform = `translateX(-${modalIndex * 100}%)`;
};
window.modalNext = () => {
  if (!productoActual) return;
  modalIndex = (modalIndex + 1) % productoActual.imgs.length;
  document.getElementById("modalSlides").style.transform = `translateX(-${modalIndex * 100}%)`;
};

// ====================== ADMIN ======================
function renderAdmin() {
  if (!adminLoggeado) return;
  const form = document.getElementById("adminForm");
  const lista = document.getElementById("listaAdmin");

  if (currentAdminTab === "productos") {
    // === PRODUCTOS ===
    form.innerHTML = `
      <h3 class="text-2xl font-semibold mb-6">Agregar Producto</h3>
      <input id="newNombre" placeholder="Nombre" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
      <div class="grid grid-cols-2 gap-3">
        <input id="newPrecio" type="number" placeholder="Precio" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
        <input id="newOld" type="number" placeholder="Precio anterior" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
      </div>
      <input id="newDesc" placeholder="Descripción" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
      <input id="newCat" placeholder="Categoría" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl">
      <label class="block mb-2 text-zinc-400">Fotos del producto (múltiples)</label>
      <input id="newImgs" type="file" multiple accept="image/*" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl">
      <div id="previewContainer" class="flex gap-3 flex-wrap mb-6"></div>
      <button onclick="agregarProducto()" class="w-full bg-orange-600 py-5 rounded-3xl text-xl">Guardar Producto</button>`;

    // Previsualización
    const fileInput = document.getElementById("newImgs");
    fileInput.onchange = () => {
      const container = document.getElementById("previewContainer");
      container.innerHTML = "";
      Array.from(fileInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.className = "w-20 h-20 object-cover rounded-2xl";
          container.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    };

    // Lista de productos
    lista.innerHTML = `<h3 class="font-semibold mb-6">Productos (${productos.length})</h3>` + productos.map(p => `
      <div class="bg-zinc-800 p-6 rounded-3xl mb-4">
        <div class="flex justify-between">
          <div>
            <h4 class="font-semibold">${p.nombre}</h4>
            <p class="text-orange-500">$${p.precio} • ${p.categoria}</p>
          </div>
          <button onclick="eliminarProducto('${p.id}')" class="text-red-500">Eliminar</button>
        </div>
        <div class="flex gap-3 mt-4">${p.imgs.map(url => `<img src="${url}" class="w-12 h-12 object-cover rounded-2xl">`).join("")}</div>
      </div>`).join("");

  } else {
    // === SLIDER DE INICIO ===
    form.innerHTML = `
      <h3 class="text-2xl font-semibold mb-6">Agregar Slide al Slider</h3>
      <input id="slideTitle" placeholder="Título del slide" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl">
      <input id="slideSubtitle" placeholder="Subtítulo" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl">
      <label class="block mb-2 text-zinc-400">Imagen del slide</label>
      <input id="slideImg" type="file" accept="image/*" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl">
      <button onclick="agregarSlide()" class="w-full bg-orange-600 py-5 rounded-3xl text-xl">Subir Slide</button>`;

    lista.innerHTML = `<h3 class="font-semibold mb-6">Slides actuales (${sliderSlides.length})</h3>` + sliderSlides.map((s, i) => `
      <div class="bg-zinc-800 p-4 rounded-3xl flex gap-4 items-center mb-4">
        <img src="${s.img}" class="w-20 h-20 object-cover rounded-2xl">
        <div class="flex-1">
          <h4>${s.title}</h4>
          <p class="text-sm text-zinc-400">${s.subtitle}</p>
        </div>
        <button onclick="eliminarSlide('${s.id}')" class="text-red-500">Eliminar</button>
      </div>`).join("");
  }
}

async function agregarProducto() { /* misma función que antes */ 
  // (código completo de agregarProducto con múltiples imágenes)
  const nombre = document.getElementById("newNombre").value.trim();
  const precio = parseInt(document.getElementById("newPrecio").value);
  const old = parseInt(document.getElementById("newOld").value) || null;
  const desc = document.getElementById("newDesc").value.trim();
  const cat = document.getElementById("newCat").value.trim();
  const files = document.getElementById("newImgs").files;

  if (!nombre || !precio || !cat || files.length === 0) return mostrarToast("❌ Faltan datos");

  mostrarToast("⏳ Subiendo imágenes...");
  const imgUrls = [];

  for (let file of files) {
    const storageRef = fb.ref(window.storage, `productos/${Date.now()}-${file.name}`);
    await fb.uploadBytes(storageRef, file);
    const url = await fb.getDownloadURL(storageRef);
    imgUrls.push(url);
  }

  await fb.addDoc(fb.collection(db, "productos"), { nombre, precio, old, descripcion: desc, categoria: cat, imgs: imgUrls });
  mostrarToast("✅ Producto guardado");
  cargarProductos();
}

async function eliminarProducto(id) {
  if (confirm("Eliminar producto?")) {
    await fb.deleteDoc(fb.doc(db, "productos", id));
    cargarProductos();
  }
}

// ====================== SLIDER MANAGEMENT ======================
window.agregarSlide = async function() {
  const title = document.getElementById("slideTitle").value.trim();
  const subtitle = document.getElementById("slideSubtitle").value.trim();
  const file = document.getElementById("slideImg").files[0];

  if (!title || !subtitle || !file) return mostrarToast("❌ Completa todos los campos");

  mostrarToast("⏳ Subiendo slide...");
  const storageRef = fb.ref(window.storage, `slider/${Date.now()}-${file.name}`);
  await fb.uploadBytes(storageRef, file);
  const img = await fb.getDownloadURL(storageRef);

  await fb.addDoc(fb.collection(db, "slider"), {
    title,
    subtitle,
    img,
    order: sliderSlides.length + 1
  });

  mostrarToast("✅ Slide agregado");
  cargarSlider();
  renderAdmin();
};

window.eliminarSlide = async function(id) {
  if (confirm("¿Eliminar este slide del inicio?")) {
    await fb.deleteDoc(fb.doc(db, "slider", id));
    cargarSlider();
    renderAdmin();
  }
};

// ====================== INIT ======================
window.onload = function() {
  cargarProductos();
  cargarSlider();
  mostrarSeccion("inicio");
  actualizarCarrito();

  // Búsqueda
  document.getElementById("searchInput").addEventListener("input", e => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderCatalogo();
  });

  console.log("🚀 TechStore v2.0 listo");
};