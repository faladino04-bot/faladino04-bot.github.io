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
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "administrador";

// Al iniciar la vista, cargamos los grados y la tabla de asignaturas
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
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

  await cargarSelectGrados();
  await cargarAsignaturasAdmin();
});

// Función para cargar los grados en el selector de creación
async function cargarSelectGrados() {
  const selectGrado = document.getElementById("select_grado");
  if (!selectGrado) return;
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

// Función para cargar la tabla de gestión de asignaturas y profesores
async function cargarAsignaturasAdmin() {
  const tbody = document.getElementById("tabla_asignaturas_admin");
  if (!tbody) return;
  tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; padding: 15px;'>Cargando asignaturas...</td></tr>";

  try {
    const { data: asignaturas, error } = await db
      .from("asignaturas")
      .select(`
        id,
        nombre,
        profesor_id,
        grados:grado_id (nombre)
      `)
      .order("nombre");

    if (error) throw error;

    const usuarios = await listarUsuarios();
    const profesores = usuarios.filter(u => u.rol === "profesor");

    if (!asignaturas || asignaturas.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#777; padding: 15px;'>No hay asignaturas creadas todavía.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    asignaturas.forEach(asig => {
      const nombreGrado = asig.grados ? asig.grados.nombre : "Sin grado";
      
      let optionsProfesor = "<option value=''>-- Sin asignar --</option>";
      profesores.forEach(p => {
        const selected = p.id === asig.profesor_id ? "selected" : "";
        optionsProfesor += `<option value="${p.id}" ${selected}>${p.nombre}</option>`;
      });

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;"><strong>${asig.nombre}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">Grado ${nombreGrado}</td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">
          <select id="select_prof_${asig.id}" style="padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; width: 100%; outline: none;">
            ${optionsProfesor}
          </select>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" onclick="guardarProfesorAsignatura('${asig.id}')" style="background: #037EF5; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold;">Asignar</button>
            <button type="button" onclick="quitarProfesorAsignatura('${asig.id}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold;">Quitar</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al cargar asignaturas:", err.message);
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:red; padding: 15px;'>Error al cargar las asignaturas.</td></tr>";
  }
}

window.guardarProfesorAsignatura = async function(asignaturaId) {
  const select = document.getElementById(`select_prof_${asignaturaId}`);
  const profesorId = select.value || null;

  try {
    const { error } = await db
      .from("asignaturas")
      .update({ profesor_id: profesorId })
      .eq("id", asignaturaId);

    if (error) throw error;
    alert("¡Profesor asignado correctamente a la asignatura!");
    await cargarAsignaturasAdmin();
  } catch (err) {
    alert("Error al asignar profesor: " + err.message);
  }
};

window.quitarProfesorAsignatura = async function(asignaturaId) {
  if (!confirm("¿Estás seguro de quitar al profesor de esta asignatura?")) return;

  try {
    const { error } = await db
      .from("asignaturas")
      .update({ profesor_id: null })
      .eq("id", asignaturaId);

    if (error) throw error;
    alert("¡Profesor desasignado correctamente!");
    await cargarAsignaturasAdmin();
  } catch (err) {
    alert("Error al desasignar profesor: " + err.message);
  }
};

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
    await cargarSelectGrados();
  }
});

// 2. Crear Asignatura (Limpio de profesor, se gestiona abajo en la tabla)
document.getElementById("form-asignatura").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombreAsig = document.getElementById("nombre_asignatura").value.trim();
  const gradoId = document.getElementById("select_grado").value;

  const { error } = await db.from("asignaturas").insert([{
    nombre: nombreAsig,
    grado_id: gradoId,
    profesor_id: null
  }]);

  if (error) {
    alert("Error al crear asignatura: " + error.message);
  } else {
    alert("¡Asignatura creada correctamente!");
    document.getElementById("form-asignatura").reset();
    await cargarSelectGrados();
    await cargarAsignaturasAdmin(); // Refresca automáticamente la tabla inferior
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