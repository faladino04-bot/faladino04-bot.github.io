// Toggle Menú lateral
document.getElementById("logo").addEventListener("click", () => {
    document.getElementById("menu_lado").classList.toggle("oculto");
});

// Configuración de botones del menú
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
            icono.addEventListener("click", () => { window.location.href = urlRedireccion; });
        } else if (urlRedireccion == "profesor.html"){
            icono.addEventListener("click", () => { window.location.href = "../" + urlRedireccion; });
        } else {
            icono.addEventListener("click", () => { window.location.href = "../" + idIcono + "/" + urlRedireccion; });
        }
    }
}

configurarBotonMenu("home", "texto_home", "mhome", "profesor.html");
configurarBotonMenu("usuario", "texto_usuario", "musuario", "usuario.html");
configurarBotonMenu("pea", "texto_pea", "mpea", "pea.html");
configurarBotonMenu("actividades", "texto_actividades", "mactividades", "actividades.html");
configurarBotonMenu("examenes", "texto_examenes", "mexamenes", "examenes.html");
configurarBotonMenu("anuncios", "texto_anuncios", "manuncios", "anuncios.html");
configurarBotonMenu("mensajes", "texto_mensajes", "mmensajes", "mensajes.html");
configurarBotonMenu("calendario", "texto_calendario", "mcalendario", "calendario.html");

document.getElementById("cerrar").addEventListener("click", () => {
    db.auth.signOut();
    window.location.href = "../../index.html";
});

// Supabase Connection
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ROL_REQUERIDO = "profesor";

let usuarioActualId = null;

// Validación de Sesión e Inicialización
(async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        window.location.href = "../../index.html";
        return;
    }

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

    usuarioActualId = perfil.id;
    console.log("Sesión activa Anuncios:", perfil.nombre);

    await cargarGradosProfesor();
    await cargarAnuncios();
})();

// Cargar grados del profesor en el selector del formulario
async function cargarGradosProfesor() {
    const selectDestino = document.getElementById("select_destino_grado");

    try {
        const { data: asignaturas, error } = await db
            .from("asignaturas")
            .select(`
                grado_id,
                grados:grado_id (id, nombre)
            `)
            .eq("profesor_id", usuarioActualId);

        if (error) throw error;

        if (!asignaturas || asignaturas.length === 0) return;

        const gradosMap = new Map();
        asignaturas.forEach(item => {
            if (item.grados) {
                gradosMap.set(item.grados.id, item.grados.nombre);
            }
        });

        gradosMap.forEach((nombre, id) => {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = `Grado ${nombre}`;
            selectDestino.appendChild(option);
        });

    } catch (err) {
        console.error("Error al cargar grados:", err.message);
    }
}

// Crear Anuncio
document.getElementById("form_crear_anuncio").addEventListener("submit", async (e) => {
    e.preventDefault();

    const destinoVal = document.getElementById("select_destino_grado").value;
    const gradoId = destinoVal === "general" ? null : destinoVal;
    const titulo = document.getElementById("input_titulo_anuncio").value.trim();
    const mensaje = document.getElementById("input_mensaje_anuncio").value.trim();

    try {
        const { error } = await db.from("anuncios").insert([{
            autor_id: usuarioActualId,
            grado_id: gradoId,
            titulo: titulo,
            contenido: mensaje
        }]);

        if (error) throw error;

        alert("¡Anuncio publicado con éxito!");
        document.getElementById("form_crear_anuncio").reset();
        // Restablecer por defecto la opción general en el select
        document.getElementById("select_destino_grado").value = "general";
        cargarAnuncios();

    } catch (err) {
        console.error("Error al publicar anuncio:", err.message);
        alert("Hubo un error al publicar el anuncio.");
    }
});

// Cargar Listado de Anuncios
async function cargarAnuncios() {
    const contenedor = document.getElementById("contenedor_anuncios");
    contenedor.innerHTML = "<p class='empty-msg'>Cargando...</p>";

    try {
        const { data: anuncios, error } = await db
            .from("anuncios")
            .select(`
                *,
                perfiles:autor_id (nombre, rol),
                grados:grado_id (nombre)
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!anuncios || anuncios.length === 0) {
            contenedor.innerHTML = "<p class='empty-msg'>No hay anuncios disponibles en este momento.</p>";
            return;
        }

        contenedor.innerHTML = "";
        anuncios.forEach(anun => {
            const autorNombre = anun.perfiles ? anun.perfiles.nombre : "Institución";
            const esGeneral = !anun.grado_id;
            const etiquetaDestino = esGeneral ? "General (Institucional)" : `Grado ${anun.grados.nombre}`;
            const claseGeneral = esGeneral ? "general" : "";
            const fechaStr = new Date(anun.created_at).toLocaleString();

            const div = document.createElement("div");
            div.className = `anuncio-item ${claseGeneral}`;
            div.innerHTML = `
                <div class="anuncio-header">
                    <h4>${anun.titulo}</h4>
                    <span class="badge-tag ${claseGeneral}">${etiquetaDestino}</span>
                </div>
                <p>${anun.contenido}</p>
                <div class="anuncio-footer">
                    <span>Publicado por: <strong>${autorNombre}</strong></span>
                    <span>${fechaStr}</span>
                </div>
            `;
            contenedor.appendChild(div);
        });

    } catch (err) {
        console.error("Error al cargar anuncios:", err.message);
        contenedor.innerHTML = "<p class='empty-msg'>Error al cargar el tablón de anuncios.</p>";
    }
}