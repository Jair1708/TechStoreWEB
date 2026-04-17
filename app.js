// ====================== VARIABLES GLOBALES ======================
let productos = [];
let sliderSlides = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;
let editingId = null;

// ====================== UTILIDADES ======================
function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(precio || 0);
}

function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastText").innerHTML = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

function saveCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function actualizarCarrito() {
  const totalItems = carrito.reduce((a, b) => a + b.cantidad, 0);
  document.getElementById("cartCount").textContent = totalItems;
}

// ====================== MENÚ MÓVIL ======================
window.toggleMobileMenu = function() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("hidden");
};

// ====================== NAVEGACIÓN ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if (window.innerWidth < 768) toggleMobileMenu();
};

// ====================== FIREBASE ======================
async function cargarProductos() {
  const q = fb.query(fb.collection(window.db, "productos"), fb.orderBy("nombre"));
  const snapshot = await fb.getDocs(q);
  productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderFiltros();
  renderCatalogo();
}

async function cargarSlider() {
  const snapshot = await fb.getDocs(fb.collection(window.db, "slider"));
  sliderSlides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderSlider();
}

// ====================== CATÁLOGO ======================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  const term = document.getElementById("searchInput").value.toLowerCase().trim();

  const filtrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(term) ||
    (p.codigo && p.codigo.toLowerCase().includes(term))
  );

  grid.innerHTML = filtrados.map(p => `
    <div onclick="verProducto('${p.id}')" class="product-card bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer">
      <img src="${p.imgs?.[0] || 'https://picsum.photos/id/870/600/600'}" class="w-full h-64 object-cover">
      <div class="p-6">
        <div class="flex justify-between items-start">
          <p class="text-orange-500 text-sm">${p.categoria || 'General'}</p>
          ${p.codigo ? `<span onclick="event.stopImmediatePropagation();copiarID('${p.codigo}')" class="text-xs font-mono bg-emerald-900 text-emerald-400 px-3 py-1 rounded-2xl cursor-pointer">ID: ${p.codigo}</span>` : ''}
        </div>
        <h3 class="font-semibold text-xl mt-2 line-clamp-2">${p.nombre}</h3>
        <div class="flex justify-between items-baseline mt-4">
          <span class="text-3xl font-bold">${formatearPrecio(p.precio)}</span>
          ${p.old ? `<span class="text-zinc-400 line-through">${formatearPrecio(p.old)}</span>` : ''}
        </div>
      </div>
    </div>
  `).join("") || `<p class="col-span-full text-center py-20 text-zinc-400 text-xl">No se encontraron productos</p>`;
}

function renderFiltros() {
  document.getElementById("filtros").innerHTML = `<button onclick="cargarProductos()" class="tab tab-active px-8 py-3 rounded-3xl">Todos los productos</button>`;
}

// ====================== MODAL PRODUCTO ======================
window.verProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  let index = 0;
  const modalHTML = `
    <div class="p-8">
      <button onclick="document.getElementById('modal').classList.add('hidden')" class="float-right text-5xl text-zinc-400 hover:text-white">×</button>
      
      <div class="relative">
        <img id="modalImage" src="${p.imgs[0]}" class="w-full rounded-3xl">
        <div class="absolute inset-x-0 top-1/2 flex justify-between px-6">
          <button onclick="cambiarFoto(-1)" class="bg-black/70 hover:bg-black text-white w-12 h-12 rounded-2xl text-4xl">‹</button>
          <button onclick="cambiarFoto(1)" class="bg-black/70 hover:bg-black text-white w-12 h-12 rounded-2xl text-4xl">›</button>
        </div>
      </div>

      <div class="flex justify-between items-center mt-6">
        <h2 class="text-4xl font-semibold">${p.nombre}</h2>
        ${p.codigo ? `<button onclick="copiarID('${p.codigo}')" class="flex items-center gap-2 text-emerald-400 font-mono bg-emerald-900 px-4 py-2 rounded-3xl text-sm">📋 ID: <span class="font-bold">${p.codigo}</span></button>` : ''}
      </div>

      <p class="text-3xl font-bold text-orange-500 mt-2">${formatearPrecio(p.precio)}</p>
      <p class="mt-6 text-zinc-300 leading-relaxed">${p.descripcion || 'Sin descripción'}</p>

      <button onclick="agregarAlCarrito('${p.id}'); document.getElementById('modal').classList.add('hidden')" 
              class="w-full mt-10 py-7 bg-orange-600 hover:bg-orange-500 rounded-3xl text-2xl font-semibold">
        🛒 Agregar al carrito
      </button>
    </div>
  `;

  document.getElementById("modalContent").innerHTML = modalHTML;
  document.getElementById("modal").classList.remove("hidden");

  window.cambiarFoto = function(dir) {
    index = (index + dir + p.imgs.length) % p.imgs.length;
    document.getElementById("modalImage").src = p.imgs[index];
  };
};

// ====================== CARRITO ======================
window.agregarAlCarrito = function(id) {
  const producto = productos.find(p => p.id === id);
  const existe = carrito.find(i => i.id === id);
  if (existe) existe.cantidad++;
  else carrito.push({ ...producto, cantidad: 1 });

  saveCarrito();
  actualizarCarrito();
  mostrarToast("✅ Agregado al carrito");
};

function renderCarrito() {
  const container = document.getElementById("carritoItems");
  if (carrito.length === 0) {
    container.innerHTML = `<p class="text-center py-12 text-zinc-400 text-xl">Tu carrito está vacío 😢</p>`;
    document.getElementById("subtotal").innerHTML = `<span class="text-3xl font-bold">${formatearPrecio(0)}</span>`;
    return;
  }

  container.innerHTML = carrito.map((item, i) => `
    <div class="flex gap-4 bg-zinc-800 p-4 rounded-3xl">
      <img src="${item.imgs?.[0] || ''}" class="w-20 h-20 object-cover rounded-2xl">
      <div class="flex-1">
        <h4 class="font-semibold">${item.nombre}</h4>
        <p class="text-orange-500">${formatearPrecio(item.precio)}</p>
        <div class="flex items-center gap-4 mt-4">
          <button onclick="cambiarCantidad(${i}, -1)" class="w-9 h-9 bg-zinc-700 hover:bg-zinc-600 rounded-2xl text-xl">-</button>
          <span class="font-semibold text-xl w-8 text-center">${item.cantidad}</span>
          <button onclick="cambiarCantidad(${i}, 1)" class="w-9 h-9 bg-zinc-700 hover:bg-zinc-600 rounded-2xl text-xl">+</button>
          <button onclick="eliminarDelCarrito(${i})" class="ml-auto text-red-500 hover:text-red-400">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");

  const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  document.getElementById("subtotal").innerHTML = `<span class="text-3xl font-bold">${formatearPrecio(subtotal)}</span>`;
}

window.cambiarCantidad = function(i, delta) {
  carrito[i].cantidad += delta;
  if (carrito[i].cantidad < 1) carrito[i].cantidad = 1;
  saveCarrito();
  actualizarCarrito();
  renderCarrito();
};

window.eliminarDelCarrito = function(i) {
  carrito.splice(i, 1);
  saveCarrito();
  actualizarCarrito();
  renderCarrito();
};

window.toggleCart = function() {
  const panel = document.getElementById("carritoPanel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) renderCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return mostrarToast("❌ El carrito está vacío");

  let mensaje = `Hola TechStore 🔥\n\nQuiero comprar:\n\n`;
  carrito.forEach(item => {
    mensaje += `• ${item.nombre} × ${item.cantidad} → ${formatearPrecio(item.precio * item.cantidad)}\n`;
  });

  const total = carrito.reduce((a, b) => a + b.precio * b.cantidad, 0);
  mensaje += `\nTotal: ${formatearPrecio(total)}\n\n¡Gracias! Confírmame por favor.`;

  // 🔥 CAMBIA ESTE NÚMERO POR EL TUYO
  const numeroWhats = "573XXXXXXXXX";   // ←←← TU NÚMERO AQUÍ

  const url = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');

  carrito = [];
  saveCarrito();
  actualizarCarrito();
  toggleCart();
  mostrarToast("✅ Pedido enviado por WhatsApp");
};

// ====================== ADMIN ======================
function renderAdminForm(editId = null) {
  editingId = editId;
  const p = editId ? productos.find(x => x.id === editId) : null;

  document.getElementById("adminForm").innerHTML = `
    <h3 class="text-2xl font-semibold mb-6">${editId ? 'Editar producto' : 'Agregar nuevo producto'}</h3>
    
    <input id="codigo" value="${p?.codigo || ''}" placeholder="ID / SKU" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl text-xl">
    <input id="nombre" value="${p?.nombre || ''}" placeholder="Nombre del producto" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl text-xl">
    
    <div class="grid grid-cols-2 gap-4">
      <input id="precio" type="number" value="${p?.precio || ''}" placeholder="Precio" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl text-xl">
      <input id="old" type="number" value="${p?.old || ''}" placeholder="Precio anterior (opcional)" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl text-xl">
    </div>
    
    <textarea id="descripcion" placeholder="Descripción completa" rows="4" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">${p?.descripcion || ''}</textarea>
    <input id="categoria" value="${p?.categoria || ''}" placeholder="Categoría" class="w-full mb-6 px-8 py-6 bg-zinc-800 rounded-3xl text-xl">
    
    <input id="fileInput" type="file" multiple accept="image/*" class="w-full mb-6">
    
    <button onclick="guardarProducto()" class="w-full py-7 bg-orange-600 hover:bg-orange-500 rounded-3xl text-2xl font-semibold">
      ${editId ? '💾 Guardar cambios' : '🚀 Subir producto'}
    </button>
  `;
}

window.guardarProducto = async function() {
  const codigo = document.getElementById("codigo").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseInt(document.getElementById("precio").value);
  const old = parseInt(document.getElementById("old").value) || null;
  const descripcion = document.getElementById("descripcion").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const files = document.getElementById("fileInput").files;

  if (!nombre || !precio) return mostrarToast("❌ Nombre y precio son obligatorios");

  const imgs = [];
  if (editingId) {
    const actual = productos.find(x => x.id === editingId);
    if (files.length === 0 && actual) imgs.push(...actual.imgs);
  }

 for (let file of files) {
  const fileName = `${Date.now()}-${file.name}`

  const { data, error } = await window.supabase.storage
    .from('imagenes')
    .upload(fileName, file)

  if (error) {
    console.error(error)
    mostrarToast("❌ Error subiendo imagen")
    continue
  }

  const { data: urlData } = window.supabase.storage
    .from('imagenes')
    .getPublicUrl(fileName)

  imgs.push(urlData.publicUrl)
}

  const data = { nombre, precio, old, descripcion, categoria, codigo, imgs: imgs.length ? imgs : ['https://picsum.photos/id/870/600/600'] };

  try {
    if (editingId) {
      await fb.updateDoc(fb.doc(window.db, "productos", editingId), data);
      mostrarToast("✅ Producto actualizado");
    } else {
      await fb.addDoc(fb.collection(window.db, "productos"), data);
      mostrarToast("✅ Producto agregado");
    }
    cargarProductos();
    renderAdminForm();
    renderAdmin();
  } catch (e) {
    console.error(e);
    mostrarToast("❌ Error al guardar");
  }
};

async function renderAdmin() {
  const container = document.getElementById("listaAdmin");
  container.innerHTML = productos.map(p => `
    <div class="bg-zinc-800 p-6 rounded-3xl">
      <img src="${p.imgs?.[0] || ''}" class="w-full h-40 object-cover rounded-2xl mb-4">
      <div class="flex justify-between">
        <div>
          <span class="text-xs font-mono bg-emerald-900 text-emerald-400 px-3 py-1 rounded-2xl">${p.codigo || '—'}</span>
          <h4 class="font-semibold mt-2">${p.nombre}</h4>
          <p class="text-orange-500">${formatearPrecio(p.precio)}</p>
        </div>
        <div class="flex flex-col gap-2">
          <button onclick="editarProducto('${p.id}')" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-3xl text-sm">Editar</button>
          <button onclick="eliminarProducto('${p.id}')" class="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-3xl text-sm">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");
}

window.editarProducto = function(id) {
  renderAdminForm(id);
};

window.eliminarProducto = async function(id) {
  if (confirm("¿Seguro que quieres eliminar este producto?")) {
    await fb.deleteDoc(fb.doc(window.db, "productos", id));
    cargarProductos();
    renderAdmin();
    mostrarToast("✅ Producto eliminado");
  }
};

// ====================== LOGIN ======================
window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value;

  if (!email || !pass) return mostrarToast("❌ Ingresa email y contraseña");

  try {
    await fb.signInWithEmailAndPassword(window.auth, email, pass);
    mostrarToast("✅ Bienvenido admin");
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdminForm();
    renderAdmin();
  } catch (e) {
    console.error(e);
    mostrarToast("❌ Email o contraseña incorrectos");
  }
};

window.logoutAdmin = async function() {
  await fb.signOut(window.auth);
  document.getElementById("adminPanel").classList.add("hidden");
  mostrarToast("👋 Sesión cerrada");
};

window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.copiarID = function(codigo) {
  navigator.clipboard.writeText(codigo).then(() => mostrarToast("✅ ID copiado"));
};

// ====================== SLIDER ======================
window.renderSlider = function() {
  const container = document.getElementById("slides");
  if (sliderSlides.length === 0) {
    container.innerHTML = `<div class="slide flex items-center justify-center bg-zinc-900 text-3xl">Cargando slider...</div>`;
    return;
  }

  container.innerHTML = sliderSlides.map(slide => `
    <div class="slide" style="background-image: url('${slide.img || slide.url || "https://picsum.photos/id/870/2000/800"}')">
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-12">
        <div class="max-w-md">
          <h2 class="text-5xl font-bold logo-font">${slide.titulo || "TechStore"}</h2>
          <p class="text-2xl mt-3">${slide.subtitulo || "Gadgets premium • Envío gratis"}</p>
        </div>
      </div>
    </div>
  `).join('');

  // Auto-slide
  let currentSlide = 0;
  setInterval(() => {
    currentSlide = (currentSlide + 1) % sliderSlides.length;
    container.style.transform = `translateX(-${currentSlide * 100}%)`;
  }, 5000);
};

// ====================== INICIO ======================
window.onload = function() {
  cargarProductos();
  cargarSlider();
  mostrarSeccion("inicio");
  actualizarCarrito();

  document.getElementById("searchInput").addEventListener("input", renderCatalogo);
};