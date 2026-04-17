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
  document.getElementById("cartCount").textContent = carrito.reduce((a, b) => a + b.cantidad, 0);
}

function copiarID(codigo) {
  if (!codigo) return;
  navigator.clipboard.writeText(codigo).then(() => {
    mostrarToast("✅ ID copiado al portapapeles");
  });
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
  if (window.innerWidth < 768) toggleMobileMenu(); // cierra menú móvil al cambiar sección
};

// ====================== FIREBASE - CARGAR DATOS ======================
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

// ====================== RENDER CATÁLOGO (con ID) ======================
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
        <h3 class="font-semibold text-xl mt-2">${p.nombre}</h3>
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

// ====================== MODAL PRODUCTO (con ID y botón copiar) ======================
window.verProducto = function(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;

  let index = 0;

  document.getElementById("modalContent").innerHTML = `
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
        ${p.codigo ? `<button onclick="copiarID('${p.codigo}')" class="flex items-center gap-2 text-emerald-400 font-mono bg-emerald-900 px-4 py-2 rounded-3xl text-sm">
          📋 ID: <span class="font-bold">${p.codigo}</span>
        </button>` : ''}
      </div>

      <p class="text-3xl font-bold text-orange-500 mt-2">${formatearPrecio(p.precio)}</p>
      <p class="mt-6 text-zinc-300 leading-relaxed">${p.descripcion || 'Sin descripción'}</p>

      <button onclick="agregarAlCarrito('${p.id}'); document.getElementById('modal').classList.add('hidden')" 
              class="w-full mt-10 py-7 bg-orange-600 hover:bg-orange-500 rounded-3xl text-2xl font-semibold">
        🛒 Agregar al carrito
      </button>
    </div>
  `;

  document.getElementById("modal").classList.remove("hidden");

  window.cambiarFoto = function(dir) {
    index = (index + dir + p.imgs.length) % p.imgs.length;
    document.getElementById("modalImage").src = p.imgs[index];
  };
};

// ====================== CARRITO (sin cambios) ======================
window.agregarAlCarrito = function(id) {
  const producto = productos.find(p => p.id === id);
  const existe = carrito.find(i => i.id === id);
  if (existe) existe.cantidad++;
  else carrito.push({ ...producto, cantidad: 1 });

  saveCarrito();
  actualizarCarrito();
  mostrarToast("✅ Agregado al carrito");
};

function renderCarrito() { /* ... mismo código de antes ... */ }
window.cambiarCantidad = function(i, delta) { /* mismo */ };
window.eliminarDelCarrito = function(i) { /* mismo */ };
window.toggleCart = function() { /* mismo */ };
window.comprarPorWhatsApp = function() { /* mismo */ };

// ====================== ADMIN - FORMULARIO (AGREGAR / EDITAR) ======================
function renderAdminForm(editId = null) {
  editingId = editId;
  const p = editId ? productos.find(x => x.id === editId) : null;

  document.getElementById("adminForm").innerHTML = `
    <h3 class="text-2xl font-semibold mb-6">${editId ? 'Editar producto' : 'Agregar nuevo producto'}</h3>
    
    <input id="codigo" value="${p?.codigo || ''}" placeholder="ID del producto / SKU (para tu proveedor)" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl text-xl">
    
    <input id="nombre" value="${p?.nombre || ''}" placeholder="Nombre del producto" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">
    
    <div class="grid grid-cols-2 gap-4">
      <input id="precio" type="number" value="${p?.precio || ''}" placeholder="Precio" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">
      <input id="old" type="number" value="${p?.old || ''}" placeholder="Precio anterior (opcional)" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">
    </div>
    
    <textarea id="descripcion" placeholder="Descripción completa" rows="3" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">${p?.descripcion || ''}</textarea>
    
    <input id="categoria" value="${p?.categoria || ''}" placeholder="Categoría" class="w-full mb-6 px-8 py-6 bg-zinc-800 rounded-3xl">
    
    <input id="fileInput" type="file" multiple accept="image/*" class="w-full mb-6">
    
    <button onclick="guardarProducto()" class="w-full py-7 bg-orange-600 hover:bg-orange-500 rounded-3xl text-2xl font-semibold">
      ${editId ? '💾 Guardar cambios' : 'Subir producto'}
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

  if (!nombre || !precio) return mostrarToast("❌ Faltan nombre o precio");

  const imgs = [];
  // Si estamos editando y no subimos nuevas fotos, mantenemos las anteriores
  if (editingId) {
    const productoActual = productos.find(x => x.id === editingId);
    if (files.length === 0 && productoActual) imgs.push(...productoActual.imgs);
  }

  // Subir nuevas fotos
  for (let file of files) {
    const storageRef = fb.ref(window.storage, `productos/${Date.now()}-${file.name}`);
    await fb.uploadBytes(storageRef, file);
    const url = await fb.getDownloadURL(storageRef);
    imgs.push(url);
  }

  const data = { nombre, precio, old, descripcion, categoria, codigo, imgs };

  try {
    if (editingId) {
      await fb.updateDoc(fb.doc(window.db, "productos", editingId), data);
      mostrarToast("✅ Producto actualizado");
    } else {
      await fb.addDoc(fb.collection(window.db, "productos"), data);
      mostrarToast("✅ Producto agregado");
    }

    cargarProductos();
    renderAdminForm(); // limpia el formulario
  } catch (e) {
    mostrarToast("❌ Error al guardar");
    console.error(e);
  }
};

// ====================== LISTA ADMIN ======================
async function renderAdmin() {
  const container = document.getElementById("listaAdmin");
  container.innerHTML = productos.map(p => `
    <div class="bg-zinc-800 p-6 rounded-3xl">
      <div class="flex justify-between">
        <div>
          <span class="text-xs font-mono bg-emerald-900 text-emerald-400 px-3 py-1 rounded-2xl">${p.codigo || '—'}</span>
          <h4 class="font-semibold mt-2">${p.nombre}</h4>
          <p class="text-orange-500">${formatearPrecio(p.precio)}</p>
        </div>
        <div class="flex gap-2">
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
  if (confirm("¿Eliminar este producto?")) {
    await fb.deleteDoc(fb.doc(window.db, "productos", id));
    cargarProductos();
  }
};

// ====================== LOGIN y resto (sin cambios) ======================
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

window.login = async function() { /* mismo código de antes */ };

window.renderSlider = function() {
  console.log("Slider cargado");
};

// ====================== INICIO ======================
window.onload = function() {
  cargarProductos();
  cargarSlider();
  mostrarSeccion("inicio");
  actualizarCarrito();

  document.getElementById("searchInput").addEventListener("input", () => renderCatalogo());
};