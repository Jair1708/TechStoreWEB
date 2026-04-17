// 🔥 SECCIONES (ARREGLADO ERROR NULL)
window.mostrarSeccion = function(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("hidden"))

  const el = document.getElementById(id)
  if (el) el.classList.remove("hidden")
}

// 🔥 SUBIR PRODUCTO CON SUPABASE
window.subir = async function() {
  const nombre = document.getElementById("nombre").value
  const precio = document.getElementById("precio").value
  const file = document.getElementById("file").files[0]

  if (!nombre || !precio || !file) {
    alert("Faltan datos")
    return
  }

  const fileName = Date.now() + "-" + file.name

  const { error } = await supabase.storage
    .from('imagenes')
    .upload(fileName, file)

  if (error) {
    console.error(error)
    alert("Error subiendo imagen")
    return
  }

  const { data } = supabase.storage
    .from('imagenes')
    .getPublicUrl(fileName)

  const imgUrl = data.publicUrl

  // 🔥 guardar en local (puedes cambiar a Firebase luego)
  let productos = JSON.parse(localStorage.getItem("productos")) || []

  productos.push({ nombre, precio, img: imgUrl })

  localStorage.setItem("productos", JSON.stringify(productos))

  alert("Producto subido 🔥")
  cargar()
}

// 🔥 CARGAR PRODUCTOS
function cargar() {
  const cont = document.getElementById("catalogo")
  let productos = JSON.parse(localStorage.getItem("productos")) || []

  cont.innerHTML = productos.map(p => `
    <div style="border:1px solid #555; margin:10px; padding:10px">
      <img src="${p.img}" width="150"><br>
      ${p.nombre}<br>
      $${p.precio}
    </div>
  `).join("")
}

// 🔥 INIT
window.onload = function() {
  cargar()
  mostrarSeccion("inicio")
}