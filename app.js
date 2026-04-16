```js
// ================= DATA =================
let productos = [];
let carrito = [];
let adminLoggeado = true; // para pruebas

// ================= FIREBASE =================
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

  renderCatalogo();
}

// ================= UI =================
function mostrarSeccion(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function toggleCart() {
  alert("Carrito abierto (demo)");
}

function abrirLogin() {
  alert("Login (demo)");
}

// ================= CATALOGO =================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  if (!grid) return;

  grid.innerHTML = productos.map(p => `
    <div class="bg-zinc-900 p-4 rounded-xl">
      <img src="${p.imgs?.[0]}" class="w-full h-40 object-cover mb-2">
      <h3>${p.nombre}</h3>
      <p>$${p.precio}</p>
    </div>
  `).join("");
}

// ================= ADMIN =================
async function agregarProducto() {
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

  alert("Producto guardado");
  cargarProductos();
}

// ================= INIT =================
window.onload = function () {
  cargarProductos();
};
```
