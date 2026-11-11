// menu lateral
document.getElementById("logo").addEventListener("click", () => {
const menu = document.getElementById("menu_lado");
  menu.classList.toggle("oculto");
});

//home
document.getElementById("home").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_home").classList.remove("oculto");
  document.getElementById("mhome").style.backgroundColor = "#037EF5"
});
document.getElementById("home").addEventListener("click", ()=>{
  window.location.href = "admin.html";
});
document.getElementById("home").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_home").classList.add("oculto");
  document.getElementById("mhome").style.backgroundColor = "transparent"
});

// agregar usuario
document.getElementById("agregar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_agregar").classList.remove("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("agregar_usuario").addEventListener("click", ()=>{
  window.location.href = "añadir/añadir.html";
});
document.getElementById("agregar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_agregar").classList.add("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "transparent"
});

//crear curso/asignatura/anuncio
document.getElementById("crear").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_crear").classList.remove("oculto");
  document.getElementById("mcrear").style.backgroundColor = "#037EF5"
});
document.getElementById("crear").addEventListener("click", ()=>{
  window.location.href = "crear/crear.html";
});
document.getElementById("crear").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_crear").classList.add("oculto");
  document.getElementById("mcrear").style.backgroundColor = "transparent"
});

//borrar usuario
document.getElementById("borrar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_borrar").classList.remove("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("borrar_usuario").addEventListener("click", ()=>{
  window.location.href = "borrar/borrar.html";
});
document.getElementById("borrar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_borrar").classList.add("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "transparent"
});

//buscar usuario
document.getElementById("buscar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_buscar").classList.remove("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("buscar_usuario").addEventListener("click", ()=>{
  window.location.href = "buscar/buscar.html";
});
document.getElementById("buscar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_buscar").classList.add("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "transparent"
});

//cerrar sesión
document.getElementById("cerrar").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_cerrar").classList.remove("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "#037EF5"
});

document.getElementById("cerrar").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_cerrar").classList.add("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "transparent"
});

document.getElementById("cerrar").addEventListener("click", ()=>{
  db.auth.signOut();
  window.location.href = "../index.html";
  return;
});


// Protección de sesion usando supabase
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

  const textoPrincipal = document.getElementById("texto-principal");
  if (textoPrincipal) {
    textoPrincipal.textContent = `Bienvenido Administrador, ${perfil.nombre}`;
  }
})();
