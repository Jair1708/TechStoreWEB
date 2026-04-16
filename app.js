// ====================== DATA ======================
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;
let filtroActual = "Todos";
let searchTerm = "";
let currentSlide = 0;

// ====================== FIREBASE ======================
async function cargarProductos() {
  try {
    const querySnapshot = await fb.getDocs(fb.collection(db, "productos"));
    productos = [];
    querySnapshot.forEach((docu) => {
      productos.push({ id: docu.id, ...docu.data() });
    });

    console.log("✅ PRODUCTOS CARGADOS:", productos.length);
    renderFiltros();
    renderCatalogo();
    renderAdmin();
    actualizarCarrito();
  } catch (e) {
    console.error("Error Firebase:", e);
  }
}

// ====================== UTIL ======================
function saveCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  const text = document.getElementById("toastText");
  if (toast && text) {
    text.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  } else {
    console.log(msg);
  }
}

function actualizarCarrito() {
  const count = document.getElementById("cartCount");
  if (count) count.textContent = carrito.length;
}

// ====================== SECCIONES ======================
window.mostrarSeccion = function (id) {
  document.querySelectorAll("section").forEach((s) => s.classList.add("hidden"));
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
};

// ====================== SLIDER ======================
const slidesData = [
  {
    title: "Powerbanks 20.000mAh",
    subtitle: "Carga rápida • Envío gratis",
    img: "https://picsum.photos/id/1015/1200/500",
    cta: "Ver powerbanks",
  },
  {
    title: "Smartwatches Premium",
    subtitle: "Desde $89.900 • 4.9 estrellas",
    img: "https://picsum.photos/id/201/1200/500",
    cta: "Ver smartwatches",
  },
  {
    title: "Audífonos Inalámbricos",
    subtitle: "Cancelación de ruido • 48h batería",
    img: "https://picsum.photos/id/870/1200/500",
    cta: "Ver audífonos",
  },
];

function renderSlider() {
  const slidesCont = document.getElementById("slides");
  const dotsCont = document.getElementById("dots");

  slidesCont.innerHTML = slidesData
    .map(
      (slide) => `
    <div class="slide flex-shrink-0 w-full h-full bg-cover bg-center flex items-center relative" 
         style="background-image: url('${slide.img}')">
      <div class="max-w-7xl mx-auto px-6 relative z-10 text-white">
        <h2 class="text-5xl lg:text-7xl font-bold logo-font tracking-tighter">${slide.title}</h2>
        <p class="text-3xl mt-4">${slide.subtitle}</p>
        <button onclick="mostrarSeccion('catalogo')" 
                class="mt-8 bg-orange-600 hover:bg-orange-500 px-10 py-5 rounded-3xl text-xl font-semibold flex items-center gap-3">
          ${slide.cta} <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>`
    )
    .join("");

  dotsCont.innerHTML = slidesData
    .map(
      (_, i) => `
    <button onclick="goToSlide(${i})" 
            class="w-4 h-4 rounded-full transition-all ${i === 0 ? "bg-orange-500 scale-125" : "bg-white/50 hover:bg-white"}"></button>`
    )
    .join("");
}

window.prevSlide = function () {
  currentSlide = (currentSlide - 1 + slidesData.length) % slidesData.length;
  updateSlider();
};

window.nextSlide = function () {
  currentSlide = (currentSlide + 1) % slidesData.length;
  updateSlider();
};

window.goToSlide = function (i) {
  currentSlide = i;
  updateSlider();
};

function updateSlider() {
  const slidesCont = document.getElementById("slides");
  slidesCont.style.transform = `translateX(-${currentSlide * 100}%)`;

  document.querySelectorAll("#dots button").forEach((dot, i) => {
    dot.classList.toggle("bg-orange-500", i === currentSlide);
    dot.classList.toggle("scale-125", i === currentSlide);
    dot.classList.toggle("bg-white/50", i !== currentSlide);
  });
}

// ====================== LOGIN ADMIN ======================
window.abrirLogin = function () {
  document.getElementById("loginBox").classList.remove("hidden");
};

window.cerrarLogin = function () {
  document.getElementById("loginBox").classList.add("hidden");
};

window.login = function () {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (user === "admin" && pass === "1234") {
    adminLoggeado = true;
    cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdmin();
    mostrarToast("✅ Bienvenido al Panel Admin");
  } else {
    mostrarToast("❌ Usuario o contraseña incorrectos");
  }
};

window.cerrarAdmin = function () {
  document.getElementById("adminPanel").classList.add("hidden");
};

// ====================== CARRITO ======================
window.toggleCart = function () {
  const panel = document.getElementById("carritoPanel");
  const isHidden = panel.classList.contains("translate-x-full");

  if (isHidden) {
    panel.classList.remove("translate-x-full");
    renderCarrito();
  } else {
    panel.classList.add("translate-x-full");
  }
};

function renderCarrito() {
  const cont = document.getElementById("carritoItems");
  const subtotalEl = document.getElementById("subtotal");

  if (carrito.length === 0) {
    cont.innerHTML = `<p class="text-center text-zinc-400 py-16 text-xl">🛒 Tu carrito está vacío</p>`;
    subtotalEl.textContent = "$0";
    return;
  }

  cont.innerHTML = carrito
    .map(
      (p, idx) => `
    <div class="flex gap-4 bg-zinc-800 p-4 rounded-3xl">
      <img src="${p.imgs?.[0] || ""}" class="w-20 h-20 object-cover rounded-2xl">
      <div class="flex-1">
        <h4 class="font-semibold">${p.nombre}</h4>
        <p class="text-orange-500 text-xl">$${p.precio}</p>
      </div>
      <button onclick="eliminarDelCarrito(${idx})" class="text-3xl text-red-500 hover:text-red-600">×</button>
    </div>`
    )
    .join("");

  const subtotal = carrito.reduce((sum, p) => sum + (p.precio || 0), 0);
  subtotalEl.textContent = `$${subtotal}`;
}

window.eliminarDelCarrito = function (idx) {
  carrito.splice(idx, 1);
  saveCarrito();
  renderCarrito();
  actualizarCarrito();
};

window.comprarPorWhatsApp = function () {
  if (carrito.length === 0) return;

  let texto = "Hola TechStore 🔥\n\nQuiero comprar:\n\n";
  carrito.forEach((p) => {
    texto += `• ${p.nombre} → $${p.precio}\n`;
  });

  const total = carrito.reduce((sum, p) => sum + p.precio, 0);
  texto += `\nTotal: $${total}\nEnvío: GRATIS\n\n¿Confirmamos el pedido?`;

  const url = `https://wa.me/573248777231?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");

  // Opcional: vaciar carrito después de enviar
  // carrito = []; saveCarrito(); actualizarCarrito(); toggleCart();
};

// ====================== FILTROS + BÚSQUEDA ======================
function renderFiltros() {
  const cont = document.getElementById("filtros");
  if (!cont) return;

  const categorias = ["Todos", ...new Set(productos.map((p) => p.categoria))];

  cont.innerHTML = categorias
    .map(
      (cat) => `
    <button onclick="filtrarCategoria('${cat}')" 
            class="px-6 py-3 rounded-3xl text-sm font-medium transition-all ${
              cat === filtroActual
                ? "bg-orange-500 text-white"
                : "bg-zinc-800 hover:bg-zinc-700"
            }">
      ${cat}
    </button>`
    )
    .join("");
}

window.filtrarCategoria = function (cat) {
  filtroActual = cat;
  renderFiltros();
  renderCatalogo();
};

// ====================== CATÁLOGO ======================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;

  let lista = productos;

  // Filtro por categoría
  if (filtroActual !== "Todos") {
    lista = lista.filter((p) => p.categoria === filtroActual);
  }

  // Filtro por búsqueda
  if (searchTerm) {
    lista = lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(searchTerm) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm))
    );
  }

  grid.innerHTML = lista
    .map(
      (p) => `
    <div class="product-card bg-zinc-900 p-5 rounded-3xl hover:-translate-y-2 transition-all duration-300">
      <img src="${p.imgs?.[0] || ""}" class="w-full aspect-square object-cover rounded-2xl mb-4">
      <h3 class="font-semibold text-lg">${p.nombre}</h3>
      <div class="flex items-baseline gap-2 mt-2">
        ${p.old ? `<span class="line-through text-zinc-500 text-sm">$${p.old}</span>` : ""}
        <span class="text-3xl font-bold text-orange-500">$${p.precio}</span>
      </div>
      <button onclick="agregarAlCarrito('${p.id}')" 
              class="mt-6 w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-3xl font-semibold transition-all">
        Agregar al carrito
      </button>
    </div>`
    )
    .join("");
}

window.agregarAlCarrito = function (id) {
  const producto = productos.find((p) => p.id === id);
  if (producto) {
    carrito.push(producto);
    saveCarrito();
    actualizarCarrito();
    mostrarToast("✅ Producto agregado al carrito");
  }
};

// ====================== ADMIN ======================
function renderAdmin() {
  if (!adminLoggeado) return;

  // Formulario
  const adminForm = document.getElementById("adminForm");
  if (adminForm) {
    adminForm.innerHTML = `
      <h3 class="text-2xl font-semibold mb-6 flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> Agregar Producto
      </h3>
      <input id="newNombre" placeholder="Nombre del producto" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl outline-none focus:border-orange-500 border border-transparent">
      <div class="grid grid-cols-2 gap-3">
        <input id="newPrecio" type="number" placeholder="Precio" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl outline-none focus:border-orange-500 border border-transparent">
        <input id="newOld" type="number" placeholder="Precio anterior (opcional)" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl outline-none focus:border-orange-500 border border-transparent">
      </div>
      <input id="newDesc" placeholder="Descripción corta" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl outline-none focus:border-orange-500 border border-transparent">
      <input id="newCat" placeholder="Categoría" class="w-full mb-3 px-6 py-5 bg-zinc-800 rounded-3xl outline-none focus:border-orange-500 border border-transparent">
      <input id="newImg" placeholder="URL de la imagen" class="w-full mb-6 px-6 py-5 bg-zinc-800 rounded-3xl outline-none focus:border-orange-500 border border-transparent">
      <button onclick="agregarProducto()" class="w-full bg-orange-600 hover:bg-orange-500 py-5 rounded-3xl text-xl font-semibold">Guardar en Firebase</button>
    `;
  }

  renderListaAdmin();
}

function renderListaAdmin() {
  const lista = document.getElementById("listaAdmin");
  const contador = document.getElementById("contadorAdmin");

  if (contador) contador.textContent = productos.length;

  if (!lista) return;

  lista.innerHTML = productos
    .map(
      (p) => `
    <div class="bg-zinc-800 p-5 rounded-3xl flex justify-between items-center">
      <div>
        <h4 class="font-semibold">${p.nombre}</h4>
        <p class="text-orange-500">$${p.precio} • ${p.categoria}</p>
      </div>
      <button onclick="eliminarProducto('${p.id}')" 
              class="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-2xl text-sm font-medium">Eliminar</button>
    </div>`
    )
    .join("");
}

async function agregarProducto() {
  const nombre = document.getElementById("newNombre").value.trim();
  const precio = parseInt(document.getElementById("newPrecio").value);
  const old = parseInt(document.getElementById("newOld").value) || null;
  const desc = document.getElementById("newDesc").value.trim();
  const cat = document.getElementById("newCat").value.trim();
  const img = document.getElementById("newImg").value.trim();

  if (!nombre || !precio || !cat || !img) {
    mostrarToast("❌ Faltan datos obligatorios");
    return;
  }

  await fb.addDoc(fb.collection(db, "productos"), {
    nombre,
    precio,
    old,
    descripcion: desc,
    categoria: cat,
    imgs: [img],
  });

  mostrarToast("✅ Producto guardado en Firebase");
  cargarProductos();
}

async function eliminarProducto(id) {
  if (confirm("¿Seguro que quieres eliminar este producto?")) {
    await fb.deleteDoc(fb.doc(db, "productos", id));
    mostrarToast("Producto eliminado");
    cargarProductos();
  }
}

// ====================== INIT ======================
window.onload = function () {
  cargarProductos(); // ya es async

  mostrarSeccion("inicio");
  renderSlider();

  // Búsqueda en tiempo real
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.toLowerCase().trim();
      renderCatalogo();
    });
  }

  // Cerrar mobile menu al hacer clic en links (ya lo tienes en HTML)
  console.log("🚀 TechStore listo y mejorado");
};