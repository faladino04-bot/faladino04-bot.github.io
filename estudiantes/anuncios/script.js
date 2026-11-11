// ==========================================
// MENÚ LATERAL Y NAVEGACIÓN
// ==========================================
document.getElementById("logo").addEventListener("click", () => {
    document.getElementById("menu_lado").classList.toggle("oculto");
});

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
        if (urlRedireccion == "anuncios.html"){
            icono.addEventListener("click", () => {
                window.location.href = urlRedireccion;
            });
        }else if (urlRedireccion == "estudiante.html"){
            icono.addEventListener("click", () => {
                url = ".."+"/"+urlRedireccion;
                window.location.href = url;
            });
        }else{
            icono.addEventListener("click", () => {
                url = "../"+idIcono+"/"+urlRedireccion;
                window.location.href = url;
            });
        }
    }
}

configurarBotonMenu("home", "texto_home", "mhome", "estudiante.html");
configurarBotonMenu("usuario", "texto_usuario", "musuario", "usuario.html");
configurarBotonMenu("estadisticas", "texto_estadisticas", "mestadisticas", "estadisticas.html");
configurarBotonMenu("actividades", "texto_actividades", "mactividades", "actividades.html");
configurarBotonMenu("examenes", "texto_examenes", "mexamenes", "examenes.html");
configurarBotonMenu("anuncios", "texto_anuncios", "manuncios", "anuncios.html");
configurarBotonMenu("mensajes", "texto_mensajes", "mmensajes", "mensajes.html");
configurarBotonMenu("calendario", "texto_calendario", "mcalendario", "calendario.html");

document.getElementById("cerrar").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_cerrar").classList.remove("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "#037EF5";
});

document.getElementById("cerrar").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_cerrar").classList.add("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "transparent";
});

document.getElementById("cerrar").addEventListener("click", ()=>{
  db.auth.signOut();
  window.location.href = "../../index.html";
  return;
});

// ==========================================
// PROTECCIÓN DE SESIÓN Y CARGA DE ANUNCIOS
// ==========================================
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "estudiante";

(async () => {
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

  console.log("Sesión válida:", perfil.nombre);
  
  // Cargar anuncios de la base de datos al validar la sesión
  await cargarAnunciosEstudiante();
})();

async function cargarAnunciosEstudiante() {
    const contenedor = document.getElementById("contenedor_lista_anuncios");
    if (!contenedor) return;

    try {
        // Consultamos la tabla 'anuncios' ordenada del más reciente al más antiguo
        const { data: anuncios, error } = await db
            .from("anuncios")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        contenedor.innerHTML = "";

        if (!anuncios || anuncios.length === 0) {
            contenedor.innerHTML = `<p class="sin-anuncios">No hay anuncios generales publicados por el momento.</p>`;
            return;
        }

        anuncios.forEach(anuncio => {
            // Formatear la fecha de creación de forma legible
            let fechaFormateada = "";
            if (anuncio.created_at) {
                const fechaObj = new Date(anuncio.created_at);
                fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            const card = document.createElement("div");
            card.className = "anuncio-item";
            card.innerHTML = `
                <div class="anuncio-header">
                    <span class="anuncio-titulo">${escapeHtml(anuncio.titulo)}</span>
                    <span class="anuncio-fecha">${fechaFormateada}</span>
                </div>
                <div class="anuncio-contenido">
                    <p>${escapeHtml(anuncio.contenido)}</p>
                </div>
            `;
            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error("Error al cargar anuncios:", err.message);
        contenedor.innerHTML = `<p class="sin-anuncios" style="color: red;">Error al cargar los anuncios del sistema.</p>`;
    }
}

// Función auxiliar de seguridad para evitar inyección HTML básica
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}