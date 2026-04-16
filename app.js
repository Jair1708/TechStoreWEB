// ================= DATA =================
let productos = JSON.parse(localStorage.getItem("productos")) || [
  {
    id: 1,
    nombre: "Audífonos Pro",
    precio: 59900,
    descripcion: "Bluetooth, cancelación de ruido",
    img: "https://picsum.photos/300"
  },
  {
    id: 2,
    nombre: "Smartwatch",
    precio: 149900,
    descripcion: "Monitoreo salud + GPS",
    img: "https://picsum.photos/301"
  }
];

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// ================= SAVE =================
function save() {
  localStorage.setItem("productos", JSON.stringify(productos));
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// ================= SECCIONES =================
function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "catalogo") renderCatalogo();
}

// ================= CATALOGO =================
function renderCatalogo() {
  const grid = document.getElementById("catalogoGrid");
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

  let filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(search)
  );

  grid.innerHTML = filtrados.map(p => `
    <div class="card">
      <img src="${p.img}">
      <h3>${p.nombre}</h3>
      <p>${p.descripcion}</p>
      <b>$${p.precio.toLocaleString()}</b>
      <button onclick="agregar(${p.id})">Agregar</button>
    </div>
  `).join("");
}

// ================= CARRITO =================
function agregar(id) {
  const p = productos.find(x => x.id === id);
  const existe = carrito.find(x => x.id === id);

  if (existe) existe.cantidad++;
  else carrito.push({ ...p, cantidad: 1 });

  save();
  actualizarCarrito();
}

function actualizarCarrito() {
  document.getElementById("cartCount").innerText =
    carrito.reduce((a, b) => a + b.cantidad, 0);

  const cont = document.getElementById("carritoItems");

  let total = 0;

  cont.innerHTML = carrito.map((p, i) => {
    total += p.precio * p.cantidad;

    return `
      <div class="item">
        <p>${p.nombre}</p>
        <p>$${p.precio}</p>
        <p>x${p.cantidad}</p>
        <button onclick="eliminar(${i})">❌</button>
      </div>
    `;
  }).join("");

  document.getElementById("subtotal").innerText =
    "$" + total.toLocaleString();
}

function eliminar(i) {
  carrito.splice(i, 1);
  save();
  actualizarCarrito();
}

// ================= CART TOGGLE =================
function toggleCart() {
  document.getElementById("carritoPanel").classList.toggle("hidden");
  actualizarCarrito();
}

// ================= WHATSAPP =================
function comprarWhatsApp() {
  let msg = "Quiero comprar:\n\n";

  carrito.forEach(p => {
    msg += `- ${p.nombre} x${p.cantidad}\n`;
  });

  window.open("https://wa.me/573248777231?text=" + encodeURIComponent(msg));
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  mostrarSeccion("inicio");
  actualizarCarrito();

  const input = document.getElementById("searchInput");
  if (input) input.addEventListener("input", renderCatalogo);
});