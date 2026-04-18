// ====================== VARIABLES ======================
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ====================== SECCIONES ======================
window.mostrarSeccion = function(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"));
  const seccion = document.getElementById(id);
  if (seccion) seccion.classList.remove("hidden");
};

// ====================== CARGAR PRODUCTOS ======================
async function cargarProductos() {
  const { data: productos, error } = await window.supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error(error);

  const cont = document.getElementById("catalogo");
  cont.innerHTML = productos.map(p => `
    <div onclick="verProducto('${p.id}')" class="product-card bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer">
      <img src="${p.imgs[0]}" class="w-full h-56 object-cover">
      <div class="p-4">
        <h3 class="font-semibold text-lg">${p.nombre}</h3>
        <p class="text-orange-400 text-2xl font-bold">$${Number(p.precio).toLocaleString('es-CO')}</p>
      </div>
    </div>
  `).join("");
}

// ====================== VER PRODUCTO (MODAL) ======================
window.verProducto = async function(id) {
  const { data: p } = await window.supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (!p) return;

  let index = 0;
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = `
    <div class="p-6">
      <button onclick="document.getElementById('modal').classList.add('hidden')" class="float-right text-4xl">×</button>
      <div class="relative">
        <img id="modalImg" src="${p.imgs[0]}" class="w-full rounded-2xl">
        <div class="absolute top-1/2 w-full flex justify-between px-4">
          <button onclick="cambiarImg(-1)" class="bg-black/70 text-white w-10 h-10 rounded-2xl text-3xl">‹</button>
          <button onclick="cambiarImg(1)" class="bg-black/70 text-white w-10 h-10 rounded-2xl text-3xl">›</button>
        </div>
      </div>
      <h2 class="text-3xl font-bold mt-6">${p.nombre}</h2>
      <p class="text-orange-400 text-4xl font-bold mt-2">$${Number(p.precio).toLocaleString('es-CO')}</p>
      <p class="mt-6 text-zinc-300">${p.descripcion || 'Sin descripción'}</p>
      <button onclick="agregarAlCarrito('${p.id}')" class="w-full mt-8 bg-orange-600 hover:bg-orange-500 py-5 rounded-3xl text-xl font-semibold">🛒 Agregar al carrito</button>
    </div>
  `;

  document.getElementById("modal").classList.remove("hidden");

  window.cambiarImg = function(dir) {
    index = (index + dir + p.imgs.length) % p.imgs.length;
    document.getElementById("modalImg").src = p.imgs[index];
  };
};

// ====================== SUBIR PRODUCTO ======================
window.subirProducto = async function() {
  const nombre = document.getElementById("nombre").value.trim();
  const precio = document.getElementById("precio").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const files = document.getElementById("file").files;

  if (!nombre || !precio || files.length === 0) {
    alert("❌ Completa nombre, precio y selecciona al menos una foto");
    return;
  }

  const imgs = [];
  for (let file of files) {
    const fileName = Date.now() + "-" + file.name;
    const { error } = await window.supabase.storage.from('imagenes').upload(fileName, file);
    if (error) return alert("Error subiendo foto");
    const { data } = window.supabase.storage.from('imagenes').getPublicUrl(fileName);
    imgs.push(data.publicUrl);
  }

  const { error } = await window.supabase
    .from('productos')
    .insert({ nombre, precio: Number(precio), descripcion, imgs });

  if (error) return alert("Error guardando producto");

  alert("✅ Producto subido correctamente");
  document.getElementById("nombre").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("file").value = "";

  cargarProductos();
};

// ====================== CARRITO ======================
window.agregarAlCarrito = async function(id) {
  const { data: producto } = await window.supabase.from('productos').select('*').eq('id', id).single();
  carrito.push(producto);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  updateCarrito();
  alert("✅ Agregado al carrito");
};

function updateCarrito() {
  document.getElementById("cartCount").textContent = carrito.length;
  const itemsDiv = document.getElementById("carritoItems");
  itemsDiv.innerHTML = carrito.map((p, i) => `
    <div class="flex gap-4 bg-zinc-800 p-4 rounded-2xl">
      <img src="${p.imgs[0]}" class="w-16 h-16 object-cover rounded-xl">
      <div>
        <p class="font-semibold">${p.nombre}</p>
        <p class="text-orange-400">$${Number(p.precio).toLocaleString('es-CO')}</p>
      </div>
      <button onclick="eliminarDelCarrito(${i})" class="ml-auto text-red-500 text-sm">Eliminar</button>
    </div>
  `).join("");
}

window.eliminarDelCarrito = function(i) {
  carrito.splice(i, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  updateCarrito();
};

window.toggleCarrito = function() {
  const el = document.getElementById("carrito");
  el.classList.toggle("hidden");
  el.style.transform = el.classList.contains("hidden") ? "translateX(100%)" : "translateX(0)";
};

window.comprarPorWhatsApp = function() {
  if (carrito.length === 0) return;
  let msg = "🛒 *Pedido TechStore*%0A%0A";
  carrito.forEach(p => msg += `• ${p.nombre} - $${Number(p.precio).toLocaleString('es-CO')}%0A`);
  msg += `%0ATotal: *$${(carrito.reduce((a, p) => a + Number(p.precio), 0)).toLocaleString('es-CO')}*`;
  window.open(`https://wa.me/573248777231?text=${msg}`, "_blank");
  carrito = [];
  localStorage.setItem("carrito", JSON.stringify(carrito));
  updateCarrito();
  toggleCarrito();
};

// ====================== INICIO ======================
window.onload = () => {
  cargarProductos();
  updateCarrito();
  mostrarSeccion("inicio");
};