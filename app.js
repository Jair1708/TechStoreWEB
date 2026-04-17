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

// ====================== NAVEGACIÓN ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
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

// ====================== RENDER CATÁLOGO ======================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  const term = document.getElementById("searchInput").value.toLowerCase().trim();

  const filtrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(term)
  );

  grid.innerHTML = filtrados.map(p => `
    <div onclick="verProducto('${p.id}')" class="product-card bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer">
      <img src="${p.imgs?.[0] || 'https://picsum.photos/id/870/600/600'}" class="w-full h-64 object-cover">
      <div class="p-6">
        <p class="text-orange-500 text-sm">${p.categoria || 'General'}</p>
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
  // Por ahora simple (puedes expandirlo después)
  document.getElementById("filtros").innerHTML = `<button onclick="cargarProductos()" class="tab tab-active px-8 py-3 rounded-3xl">Todos los productos</button>`;
}

// ====================== MODAL ======================
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

      <h2 class="text-4xl font-semibold mt-8">${p.nombre}</h2>
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
  let total = 0;

  container.innerHTML = carrito.map((item, i) => {
    total += item.precio * item.cantidad;
    return `
      <div class="flex gap-6 bg-zinc-800 p-6 rounded-3xl">
        <img src="${item.imgs?.[0]}" class="w-24 h-24 object-cover rounded-2xl">
        <div class="flex-1">
          <h4 class="font-semibold">${item.nombre}</h4>
          <p class="text-orange-500">${formatearPrecio(item.precio)}</p>
          <div class="flex items-center gap-4 mt-4">
            <button onclick="cambiarCantidad(${i}, -1)" class="px-4 py-2 bg-zinc-700 rounded-2xl">-</button>
            <span class="text-xl font-semibold">${item.cantidad}</span>
            <button onclick="cambiarCantidad(${i}, 1)" class="px-4 py-2 bg-zinc-700 rounded-2xl">+</button>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-2xl">${formatearPrecio(item.precio * item.cantidad)}</p>
          <button onclick="eliminarDelCarrito(${i})" class="text-red-500 mt-6 text-sm">Eliminar</button>
        </div>
      </div>`;
  }).join("");

  document.getElementById("subtotal").innerHTML = `<span class="font-bold">${formatearPrecio(total)}</span>`;
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

window.toggleCart = function() {
  const panel = document.getElementById("carritoPanel");
  panel.classList.toggle("hidden");
  if (!panel.classList.contains("hidden")) renderCarrito();
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return;
  let msg = "🛒 *Pedido TechStore*%0A%0A";
  carrito.forEach(item => {
    msg += `*${item.cantidad} × ${item.nombre}*%0A`;
    msg += `   ${formatearPrecio(item.precio * item.cantidad)}%0A%0A`;
  });
  msg += `Total: *${document.getElementById("subtotal").innerText}*`;
  window.open(`https://wa.me/573248777231?text=${msg}`, "_blank");
  carrito = [];
  saveCarrito();
  actualizarCarrito();
  toggleCart();
};

// ====================== ADMIN ======================
window.abrirLogin = () => document.getElementById("loginBox").classList.remove("hidden");
window.cerrarLogin = () => document.getElementById("loginBox").classList.add("hidden");
window.cerrarAdmin = () => document.getElementById("adminPanel").classList.add("hidden");

// ====================== LOGIN CON FIREBASE AUTH (MEJORADO) ======================
window.login = async function() {
  const email = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value.trim();

  if (!email || !pass) {
    mostrarToast("❌ Ingresa email y contraseña");
    return;
  }

  try {
    await fb.signInWithEmailAndPassword(window.auth, email, pass);
    adminLoggeado = true;
    cerrarLogin();
    document.getElementById("adminPanel").classList.remove("hidden");
    renderAdminForm();
    mostrarToast("✅ Bienvenido al Panel Admin 🔥");
  } catch (error) {
    console.error("Error de Firebase Auth:", error.code, error.message); // ← esto te ayuda a ver el error real

    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      mostrarToast("❌ Email o contraseña incorrectos");
    } else if (error.code === "auth/user-not-found") {
      mostrarToast("❌ Este email no está registrado");
    } else if (error.code === "auth/invalid-email") {
      mostrarToast("❌ El formato del email no es válido");
    } else {
      mostrarToast("❌ Error: " + error.message);
    }
  }
};

function renderAdminForm() {
  document.getElementById("adminForm").innerHTML = `
    <h3 class="text-2xl font-semibold mb-6">Agregar nuevo producto</h3>
    <input id="nombre" placeholder="Nombre del producto" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">
    <div class="grid grid-cols-2 gap-4">
      <input id="precio" type="number" placeholder="Precio" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">
      <input id="old" type="number" placeholder="Precio anterior (opcional)" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl">
    </div>
    <textarea id="descripcion" placeholder="Descripción completa" rows="3" class="w-full mb-4 px-8 py-6 bg-zinc-800 rounded-3xl"></textarea>
    <input id="categoria" placeholder="Categoría" class="w-full mb-6 px-8 py-6 bg-zinc-800 rounded-3xl">
    <input id="fileInput" type="file" multiple accept="image/*" class="w-full mb-6">
    <button onclick="agregarProducto()" class="w-full py-7 bg-orange-600 hover:bg-orange-500 rounded-3xl text-2xl font-semibold">Subir producto</button>
  `;
}

window.agregarProducto = async function() {
  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseInt(document.getElementById("precio").value);
  const old = parseInt(document.getElementById("old").value) || null;
  const descripcion = document.getElementById("descripcion").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const files = document.getElementById("fileInput").files;

  if (!nombre || !precio || files.length === 0) return mostrarToast("❌ Faltan datos o fotos");

  const imgs = [];
  for (let file of files) {
    const storageRef = fb.ref(window.storage, `productos/${Date.now()}-${file.name}`);
    await fb.uploadBytes(storageRef, file);
    const url = await fb.getDownloadURL(storageRef);
    imgs.push(url);
  }

  await fb.addDoc(fb.collection(window.db, "productos"), {
    nombre, precio, old, descripcion, categoria, imgs
  });

  mostrarToast("✅ Producto agregado");
  cargarProductos();
  renderAdminForm();
};

// ====================== EDITAR Y ELIMINAR ======================
async function renderAdmin() {
  const container = document.getElementById("listaAdmin");
  container.innerHTML = productos.map(p => `
    <div class="bg-zinc-800 p-6 rounded-3xl">
      <div class="flex justify-between">
        <div>
          <h4 class="font-semibold">${p.nombre}</h4>
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

window.editarProducto = async function(id) { /* Implementación completa disponible si la necesitas */ };

window.eliminarProducto = async function(id) {
  if (confirm("¿Eliminar este producto?")) {
    await fb.deleteDoc(fb.doc(window.db, "productos", id));
    cargarProductos();
  }
};

window.renderSlider = function() {
  // Implementación básica (puedes expandir después)
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