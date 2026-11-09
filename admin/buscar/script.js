// Menú lateral
document.getElementById("logo").addEventListener("click", () => {
const menu = document.getElementById("menu_lado");
  menu.classList.toggle("oculto");
});

document.getElementById("home").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_home").classList.remove("oculto");
  document.getElementById("mhome").style.backgroundColor = "#037EF5"
});
document.getElementById("home").addEventListener("click", ()=>{
  window.location.href = "../admin.html";
});
document.getElementById("home").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_home").classList.add("oculto");
  document.getElementById("mhome").style.backgroundColor = "transparent"
});


document.getElementById("agregar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_agregar").classList.remove("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("agregar_usuario").addEventListener("click", ()=>{
  window.location.href = "../añadir/añadir.html";
});
document.getElementById("agregar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_agregar").classList.add("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "transparent"
});

document.getElementById("borrar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_borrar").classList.remove("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("borrar_usuario").addEventListener("click", ()=>{
  window.location.href = "../borrar/borrar.html";
});
document.getElementById("borrar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_borrar").classList.add("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "transparent"
});

document.getElementById("buscar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_buscar").classList.remove("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("buscar_usuario").addEventListener("click", ()=>{
  window.location.href = "buscar.html";
});
document.getElementById("buscar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_buscar").classList.add("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "transparent"
});

// --- LÓGICA PARA LA PÁGINA DE BUSCAR ---

// 1. Mostrar u ocultar el campo "Grado" según el rol seleccionado en la búsqueda
const buscarRol = document.getElementById("buscar_rol");
const contenedorGradoBuscar = document.getElementById("contenedor_grado_buscar");

if (buscarRol && contenedorGradoBuscar) {
  buscarRol.addEventListener("change", (e) => {
    if (e.target.value === "Estudiante") {
      contenedorGradoBuscar.style.display = "flex";
    } else {
      contenedorGradoBuscar.style.display = "none";
      document.getElementById("buscar_grado").value = "";
    }
  });
}

// 2. Mostrar botón de "Enviar mensaje" al seleccionar algún usuario
const checkboxesUsuarios = document.querySelectorAll(".seleccionar-usuario");
const seccionMensaje = document.getElementById("seccion_mensaje");

checkboxesUsuarios.forEach(checkbox => {
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      // Revisa si al menos un checkbox está seleccionado
      const algunoSeleccionado = Array.from(checkboxesUsuarios).some(cb => cb.checked);
      if (algunoSeleccionado) {
        seccionMensaje.style.display = "block";
      } else {
        seccionMensaje.style.display = "none";
        document.getElementById("caja_mensaje").style.display = "none"; // Oculta la caja si desmarca todo
      }
    });
  }
});

// 3. Mostrar la caja de texto al hacer clic en "Enviar mensaje / aviso"
const btnMostrarCaja = document.getElementById("btn_mostrar_caja_mensaje");
const cajaMensaje = document.getElementById("caja_mensaje");

if (btnMostrarCaja && cajaMensaje) {
  btnMostrarCaja.addEventListener("click", () => {
    if (cajaMensaje.style.display === "none" || cajaMensaje.style.display === "") {
      cajaMensaje.style.display = "flex";
    } else {
      cajaMensaje.style.display = "none";
    }
  });
}

// Protección de sesion con Supabase
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "administrador";

(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = "../index.html";
    return;
  }

  const { data: perfil } = await db
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", session.user.id)
    .single();

  if (!perfil || perfil.rol !== ROL_REQUERIDO) {
    await db.auth.signOut();
    window.location.href = "../index.html";
    return;
  }

  console.log("Sesión válida:", perfil.nombre);
})();
