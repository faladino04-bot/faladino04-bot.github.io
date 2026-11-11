// Toggle del Menú lateral al pulsar el Logo
document.getElementById("logo").addEventListener("click", () => {
    document.getElementById("menu_lado").classList.toggle("oculto");
});

// Función reutilizable para eventos de los botones del menú (respetando tu estructura)
function configurarBotonMenu(idIcono, idTexto, idMenu, urlRedireccion) {
    const icono = document.getElementById(idIcono);
    const texto = document.getElementById(idTexto);
    const contenedorMenu = document.getElementById(idMenu);

    if (icono && texto && contenedorMenu) {
        icono.addEventListener("mouseenter", () => {
            texto.classList.remove("oculto");
            contenedorMenu.style.backgroundColor = "#037EF5";
        });
        icono.addEventListener("mouseleave", () => {
            texto.classList.add("oculto");
            contenedorMenu.style.backgroundColor = "transparent";
        });
        if (urlRedireccion == "usuario.html"){
            icono.addEventListener("click", () => {
                window.location.href = urlRedireccion
            });
        }else if (urlRedireccion == "profesor.html"){
            icono.addEventListener("click", () => {
                let url = "../" + urlRedireccion
                window.location.href = url
            });
        }else{
            icono.addEventListener("click", () => {
                let url = "../" + idIcono + "/" + urlRedireccion
                window.location.href = url
            })
        }
    }
}

// Configuración de interacción para todos los botones del menú
configurarBotonMenu("home", "texto_home", "mhome", "profesor.html");
configurarBotonMenu("usuario", "texto_usuario", "musuario", "usuario.html");
configurarBotonMenu("actividades", "texto_actividades", "mactividades", "actividades.html");
configurarBotonMenu("examenes", "texto_examenes", "mexamenes", "examenes.html");
configurarBotonMenu("anuncios", "texto_anuncios", "manuncios", "anuncios.html");
configurarBotonMenu("mensajes", "texto_mensajes", "mmensajes", "mensajes.html");
configurarBotonMenu("calendario", "texto_calendario", "mcalendario", "calendario.html");

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

// Protección de sesión con Supabase
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "profesor";

// Validación de sesión y llamada a la función de perfil
(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = "../../index.html";
    return;
  }

  // CORRECCIÓN: Se agregó "id" a la consulta para no perder el identificador del profesor
  const { data: perfil } = await db
    .from("perfiles")
    .select("id, nombre, rol")
    .eq("id", session.user.id)
    .single();

  if (!perfil || perfil.rol !== ROL_REQUERIDO) {
    await db.auth.signOut();
    window.location.href = "../../index.html";
    return;
  }

  console.log("Sesión válida:", perfil.nombre);

  // CORRECCIÓN: Se invoca la función para que pinte los datos y los grados en pantalla
  cargarDatosPerfilProfesor(perfil);
})();

// Función específica para rellenar el perfil del profesor y sus grados
async function cargarDatosPerfilProfesor(perfil) {
    const lblNombre = document.getElementById("perfil_nombre");
    const lblUsuario = document.getElementById("perfil_usuario");
    const contenedorGrados = document.getElementById("perfil_grados");

    if (lblNombre) lblNombre.textContent = perfil.nombre;
    if (lblUsuario) lblUsuario.textContent = perfil.nombre;

    if (!contenedorGrados) return;

    try {
        // Consultar asignaturas y el nombre del grado relacionado para este profesor
        const { data: asignaturas, error } = await db
            .from("asignaturas")
            .select(`
                nombre,
                grados:grado_id (nombre)
            `)
            .eq("profesor_id", perfil.id);

        if (error) throw error;

        if (!asignaturas || asignaturas.length === 0) {
            contenedorGrados.innerHTML = "<span style='color: #777;'>No tienes grados o asignaturas asignadas</span>";
            return;
        }

        // Agrupar materias por cada grado
        const gradosMap = new Map();
        asignaturas.forEach(item => {
            if (item.grados) {
                const nombreGrado = item.grados.nombre;
                if (!gradosMap.has(nombreGrado)) {
                    gradosMap.set(nombreGrado, []);
                }
                gradosMap.get(nombreGrado).push(item.nombre);
            }
        });

        if (gradosMap.size === 0) {
            contenedorGrados.innerHTML = "<span style='color: #777;'>Sin grados registrados</span>";
            return;
        }

        // Construir la lista visualmente limpia dentro de la tarjeta
        let htmlLista = "<ul style='list-style-type: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;'>";
        gradosMap.forEach((materias, grado) => {
            htmlLista += `<li><strong style='color: #004985;'>Grado ${grado}:</strong> <span style='color: #555;'>${materias.join(", ")}</span></li>`;
        });
        htmlLista += "</ul>";

        contenedorGrados.innerHTML = htmlLista;

    } catch (err) {
        console.error("Error al obtener los grados del profesor:", err.message);
        contenedorGrados.textContent = "Error al cargar los grados";
    }
}