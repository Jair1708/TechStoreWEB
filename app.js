```js
// ====================== DATA ======================
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let adminLoggeado = false;

// ====================== FIREBASE ======================
async function cargarProductos() {
  try {
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
    renderAdmin();

  } catch (e) {
    console.error("Error Firebase:", e);
  }
}

// ====================== UTIL ======================
function saveCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function mostrarToast(msg) {
  console.log(msg);
}

// ====================== SECCIONES ======================
function mostrarSeccion(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

// ====================== LOGIN ======================
function abrirLogin() {
  adminLoggeado = !adminLoggeado;
  renderAdmin();
  mostrarToast(adminLoggeado ? "Admin activado" : "Admin desactivado");
}

// ====================== CARRITO ======================
function toggleCart() {
  alert("Carrito (demo)");
}

function agregarAlCarrito(index) {
  carrito.push(productos[index]);
  saveCarrito();
  mostrarToast("Producto agregado");
}

// ====================== FILTROS ======================
let filtroActual = "Todos";

function renderFiltros() {
  const cont = document.getElementById("filtros");
  if (!cont) return;

  const categorias = ["Todos", ...new Set(productos.map(p => p.categoria))];

  cont.innerHTML = categorias.map(cat => `
    <button onclick="filtrarCategoria('${cat}')"
    class="px-3 py-1 ${cat===filtroActual?'bg-orange-500':'bg-zinc-700'} rounded">
      ${cat}
    </button>
  `).join("");
}

function filtrarCategoria(cat) {
  filtroActual = cat;
  renderFiltros();
  renderCatalogo();
}

// ====================== CATALOGO ======================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;

  let lista = productos;
  if (filtroActual !== "Todos") {
    lista = productos.filter(p => p.categoria === filtroActual);
  }

  grid.innerHTML = lista.map((p,i) => `
    <div class="bg-zinc-900 p-4 rounded-xl">
      <img src="${p.imgs?.[0] || ''}" class="w-full h-40 object-cover">
      <h3>${p.nombre}</h3>
      <p>$${p.precio}</p>
      <button onclick="agregarAlCarrito(${i})">Agregar</button>
    </div>
  `).join("");
}

// ====================== ADMIN ======================
function renderAdmin() {
  const panel = document.getElementById("adminPanel");
  if (!panel) return;

  if (!adminLoggeado) {
    panel.innerHTML = "<p>Admin desactivado</p>";
    return;
  }

  panel.innerHTML = `
    <h3>Agregar Producto</h3>
    <input id="newNombre" placeholder="Nombre">
    <input id="newPrecio" placeholder="Precio">
    <input id="newOld" placeholder="Old">
    <input id="newDesc" placeholder="Desc">
    <input id="newCat" placeholder="Categoria">
    <input id="newImg" placeholder="Imagen URL">
    <button onclick="agregarProducto()">Guardar</button>
  `;
}

async function agregarProducto() {
  const nombre = document.getElementById("newNombre").value;
  const precio = parseInt(document.getElementById("newPrecio").value);
  const old = parseInt(document.getElementById("newOld").value);
  const desc = document.getElementById("newDesc").value;
  const cat = document.getElementById("newCat").value;
  const img = document.getElementById("newImg").value;

  if (!nombre || !precio) {
    mostrarToast("Faltan datos");
    return;
  }

  await fb.addDoc(fb.collection(db, "productos"), {
    nombre,
    precio,
    old,
    descripcion: desc,
    categoria: cat,
    imgs: [img]
  });

  mostrarToast("Guardado en Firebase");
  cargarProductos();
}

async function eliminarProducto(id) {
  await fb.deleteDoc(fb.doc(db, "productos", id));
  cargarProductos();
}

// ====================== INIT ======================
window.onload = function() {
  cargarProductos();
  mostrarSeccion("inicio");
};
```

