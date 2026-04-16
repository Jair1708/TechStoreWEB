```js
// ====================== DATA ======================
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;

// ====================== FIREBASE ======================
async function cargarProductos() {
  const querySnapshot = await fb.getDocs(fb.collection(db, "productos"));

  productos = [];

  querySnapshot.forEach((docu) => {
    productos.push({
      id: docu.id,
      ...docu.data()
    });
  });

  console.log("PRODUCTOS:", productos);

  renderFiltros();
  renderCatalogo();
}

// ====================== UTILIDADES ======================
function saveData() {
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
};

// ====================== CATALOGO ======================
let filtroActual = "Todos";

window.renderFiltros = function() {
  const filtrosContainer = document.getElementById("filtros");
  if (!filtrosContainer) return;

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];

  filtrosContainer.innerHTML = categorias.map(cat => `
    <button onclick="filtrarCategoria('${cat}')" class="px-4 py-2 rounded-xl ${filtroActual === cat ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'}">
      ${cat}
    </button>
  `).join("");
};

window.filtrarCategoria = function(categoria) {
  filtroActual = categoria;
  renderFiltros();
  renderCatalogo();
};

window.renderCatalogo = function() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;

  grid.innerHTML = productos.map(p => `
    <div class="bg-zinc-900 p-4 rounded-xl">
      <img src="${p.imgs[0]}" class="w-full h-40 object-cover mb-2">
      <h3>${p.nombre}</h3>
      <p>$${p.precio}</p>
    </div>
  `).join("");
};

// ====================== ADMIN ======================
window.agregarProducto = async function() {
  if (!adminLoggeado) return;

  const nombre = document.getElementById("newNombre").value;
  const precio = parseInt(document.getElementById("newPrecio").value);
  const old = parseInt(document.getElementById("newOld").value);
  const desc = document.getElementById("newDesc").value;
  const cat = document.getElementById("newCat").value;
  const img = document.getElementById("newImg").value;

  await fb.addDoc(fb.collection(db, "productos"), {
    nombre,
    precio,
    old,
    descripcion: desc,
    categoria: cat,
    imgs: [img]
  });

  mostrarToast("✅ Guardado en Firebase");
  cargarProductos();
};

window.eliminarProducto = async function(id) {
  await fb.deleteDoc(fb.doc(db, "productos", id));
  cargarProductos();
};

// ====================== INIT ======================
function init() {
  cargarProductos();
  mostrarSeccion("inicio");
}

window.addEventListener("load", init);
```
