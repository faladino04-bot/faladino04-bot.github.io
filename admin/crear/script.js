// Menú lateral
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
  window.location.href = "../admin.html";
});
document.getElementById("home").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_home").classList.add("oculto");
  document.getElementById("mhome").style.backgroundColor = "transparent"
});

//agregar usuario
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

//crear curso/asignatura/anuncio
document.getElementById("crear").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_crear").classList.remove("oculto");
  document.getElementById("mcrear").style.backgroundColor = "#037EF5"
});
document.getElementById("crear").addEventListener("click", ()=>{
  window.location.href = "crear.html";
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
  window.location.href = "../borrar/borrar.html";
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
  window.location.href = "../buscar/buscar.html";
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
  window.location.href = "../../index.html";
  return;
});


// ==========================================
// PROTECCIÓN DE SESIÓN Y CARGA DE DATOS
// ==========================================
// ==========================================
// PROTECCIÓN DE SESIÓN Y CARGA DE DATOS
// ==========================================
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "administrador";

window.addEventListener("DOMContentLoaded", async () => {
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = "../../index.html";
    window.location.href = "../../index.html";
    return;
  }

  const { data: perfil } = await db
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", session.user.id)
    .single();

  if (!perfil || perfil.rol !== ROL_REQUERIDO) {
    await db.auth.signOut();
    window.location.href = "../../index.html";
    return;
  }

  // Cargar selects de Grados y Profesores al iniciar
  await cargarSelectGrados();
  await cargarSelectProfesores();
});

// Funciones para poblar los selectores dinámicamente
async function cargarSelectGrados() {
  const selectGrado = document.getElementById("select_grado");
  const { data: grados, error } = await db.from("grados").select("id, nombre").order("nombre");
  
  if (error) {
    console.error("Error al cargar grados:", error.message);
    return;
  }

  selectGrado.innerHTML = "<option value=''>Seleccione un grado</option>";
  grados.forEach(g => {
    selectGrado.innerHTML += `<option value="${g.id}">${g.nombre}</option>`;
  });
}

async function cargarSelectProfesores() {
  const selectProfesor = document.getElementById("select_profesor");
  // Filtramos los perfiles cuyo rol sea "profesor"
  const { data: profesores, error } = await db.from("perfiles").select("id, nombre").eq("rol", "profesor").order("nombre");
  
  if (error) {
    console.error("Error al cargar profesores:", error.message);
    window.location.href = "../../index.html";
    return;
  }

  // Cargar selects de Grados y Profesores al iniciar
  await cargarSelectGrados();
  await cargarSelectProfesores();
});

// Funciones para poblar los selectores dinámicamente
async function cargarSelectGrados() {
  const selectGrado = document.getElementById("select_grado");
  const { data: grados, error } = await db.from("grados").select("id, nombre").order("nombre");
  
  if (error) {
    console.error("Error al cargar grados:", error.message);
    return;
  }

  selectProfesor.innerHTML = "<option value=''>Seleccione un profesor</option>";
  profesores.forEach(p => {
    selectProfesor.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
  });
}

// ==========================================
// ACCIONES DE FORMULARIOS (CREAR)
// ==========================================

// 1. Crear Grado
document.getElementById("form-grado").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombreGrado = document.getElementById("nombre_grado").value.trim();

  const { error } = await db.from("grados").insert([{ nombre: nombreGrado }]);
  if (error) {
    alert("Error al crear grado: " + error.message);
  } else {
    alert("¡Grado creado exitosamente!");
    document.getElementById("nombre_grado").value = "";
    await cargarSelectGrados(); // Actualizar el select automáticamente
  }
});

// 2. Crear Asignatura
document.getElementById("form-asignatura").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombreAsig = document.getElementById("nombre_asignatura").value.trim();
  const gradoId = document.getElementById("select_grado").value;
  const profesorId = document.getElementById("select_profesor").value;

  const { error } = await db.from("asignaturas").insert([{
    nombre: nombreAsig,
    grado_id: gradoId,
    profesor_id: profesorId
  }]);

  if (error) {
    alert("Error al crear asignatura: " + error.message);
  } else {
    alert("¡Asignatura creada y asignada correctamente!");
    document.getElementById("form-asignatura").reset();
    await cargarSelectGrados();
    await cargarSelectProfesores();
  }
});

// 3. Crear Anuncio General
document.getElementById("form-anuncio").addEventListener("submit", async (e) => {
  e.preventDefault();
  const titulo = document.getElementById("titulo_anuncio").value.trim();
  const contenido = document.getElementById("contenido_anuncio").value.trim();

  const { error } = await db.from("anuncios").insert([{ titulo, contenido }]);

  if (error) {
    alert("Error al publicar anuncio: " + error.message);
  } else {
    alert("¡Anuncio general publicado con éxito!");
    document.getElementById("form-anuncio").reset();
  }
});
  selectGrado.innerHTML = "<option value=''>Seleccione un grado</option>";
  grados.forEach(g => {
    selectGrado.innerHTML += `<option value="${g.id}">${g.nombre}</option>`;
  });
}

async function cargarSelectProfesores() {
  const selectProfesor = document.getElementById("select_profesor");
  
  try {
    // Trae todos los usuarios usando la Edge Function que ya salta RLS
    const usuarios = await listarUsuarios();
    
    // Filtramos los que tengan rol de profesor
    const profesores = usuarios.filter(u => u.rol === "profesor");

    selectProfesor.innerHTML = "<option value=''>Seleccione un profesor</option>";
    
    if (profesores.length === 0) {
      selectProfesor.innerHTML += "<option value='' disabled>No hay profesores registrados</option>";
      return;
    }

    profesores.forEach(p => {
      selectProfesor.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });

  } catch (err) {
    console.error("Error al cargar profesores:", err.message);
    selectProfesor.innerHTML = "<option value=''>Error al cargar profesores</option>";
  }
}

// ==========================================
// ACCIONES DE FORMULARIOS (CREAR)
// ==========================================

// 1. Crear Grado
document.getElementById("form-grado").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombreGrado = document.getElementById("nombre_grado").value.trim();

  const { error } = await db.from("grados").insert([{ nombre: nombreGrado }]);
  if (error) {
    alert("Error al crear grado: " + error.message);
  } else {
    alert("¡Grado creado exitosamente!");
    document.getElementById("nombre_grado").value = "";
    await cargarSelectGrados(); // Actualizar el select automáticamente
  }
});

// 2. Crear Asignatura
document.getElementById("form-asignatura").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombreAsig = document.getElementById("nombre_asignatura").value.trim();
  const gradoId = document.getElementById("select_grado").value;
  const profesorId = document.getElementById("select_profesor").value;

  const { error } = await db.from("asignaturas").insert([{
    nombre: nombreAsig,
    grado_id: gradoId,
    profesor_id: profesorId
  }]);

  if (error) {
    alert("Error al crear asignatura: " + error.message);
  } else {
    alert("¡Asignatura creada y asignada correctamente!");
    document.getElementById("form-asignatura").reset();
    await cargarSelectGrados();
    await cargarSelectProfesores();
  }
});

// 3. Crear Anuncio General
document.getElementById("form-anuncio").addEventListener("submit", async (e) => {
  e.preventDefault();
  const titulo = document.getElementById("titulo_anuncio").value.trim();
  const contenido = document.getElementById("contenido_anuncio").value.trim();

  const { error } = await db.from("anuncios").insert([{ titulo, contenido }]);

  if (error) {
    alert("Error al publicar anuncio: " + error.message);
  } else {
    alert("¡Anuncio general publicado con éxito!");
    document.getElementById("form-anuncio").reset();
  }
});