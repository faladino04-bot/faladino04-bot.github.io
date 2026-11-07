// Menú lateral
document.getElementById("logo").addEventListener("click", () => {
const menu = document.getElementById("menu_lado");
  menu.classList.toggle("oculto");
});

document.getElementById("home").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_home").classList.remove("oculto");
});
document.getElementById("home").addEventListener("click", ()=>{
  window.location.href = "../admin.html";
});
document.getElementById("home").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_home").classList.add("oculto");
});


document.getElementById("agregar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_agregar").classList.remove("oculto");
});
document.getElementById("agregar_usuario").addEventListener("click", ()=>{
  window.location.href = "../añadir/añadir.html";
});
document.getElementById("agregar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_agregar").classList.add("oculto");
});

document.getElementById("borrar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_borrar").classList.remove("oculto");
});
document.getElementById("borrar_usuario").addEventListener("click", ()=>{
  window.location.href = "borrar.html";
});
document.getElementById("borrar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_borrar").classList.add("oculto");
});

document.getElementById("buscar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_buscar").classList.remove("oculto");
});
document.getElementById("buscar_usuario").addEventListener("click", ()=>{
  window.location.href = "../buscar/buscar.html";
});
document.getElementById("buscar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_buscar").classList.add("oculto");
});

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
