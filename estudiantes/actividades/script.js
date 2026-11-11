// Menú lateral
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
        if (urlRedireccion == "actividades.html"){
            icono.addEventListener("click", () => { window.location.href = urlRedireccion; });
        }else if (urlRedireccion == "estudiante.html"){
            icono.addEventListener("click", () => { window.location.href = "../" + urlRedireccion; });
        }else{
            icono.addEventListener("click", () => { window.location.href = "../" + idIcono + "/" + urlRedireccion; });
        }
    }
}

configurarBotonMenu("home", "texto_home", "mhome", "estudiante.html");
configurarBotonMenu("usuario", "texto_usuario", "musuario", "usuario.html");
configurarBotonMenu("estadisticas", "texto_estadisticas", "mestadisticas", "estadisticas.html");
configurarBotonMenu("actividades", "texto_actividades", "mactividades", "actividades.html");
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
const ROL_REQUERIDO = "estudiante";

let usuarioActualId = null;
let gradoEstudianteNombre = null;
let actividadSeleccionadaId = null;

// Validación de Sesión e Inicialización
(async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        window.location.href = "../../index.html";
        return;
    }

    const { data: perfil } = await db
        .from("perfiles")
        .select("id, nombre, rol, grado")
        .eq("id", session.user.id)
        .single();

    if (!perfil || perfil.rol !== ROL_REQUERIDO) {
        await db.auth.signOut();
        window.location.href = "../../index.html";
        return;
    }

    usuarioActualId = perfil.id;
    gradoEstudianteNombre = perfil.grado; // Ej. "10" o "10°"
    console.log("Sesión válida estudiante:", perfil.nombre, "Grado:", gradoEstudianteNombre);

    await cargarActividadesEstudiante();
})();

// Cargar Actividades desde Supabase filtradas por el grado del estudiante
async function cargarActividadesEstudiante() {
    const contenedorAcordeon = document.getElementById("contenedor_acordeon_materias");
    contenedorAcordeon.innerHTML = "<p class='empty-msg'>Cargando actividades...</p>";

    if (!gradoEstudianteNombre) {
        contenedorAcordeon.innerHTML = "<p class='empty-msg'>No tienes un grado asignado en tu perfil.</p>";
        return;
    }

    try {
        // 1. Buscar el ID del grado del estudiante en la tabla 'grados'
        const { data: gradoObj, error: errGrado } = await db
            .from("grados")
            .select("id")
            .ilike("nombre", `%${gradoEstudianteNombre}%`)
            .single();

        if (errGrado || !gradoObj) {
            contenedorAcordeon.innerHTML = "<p class='empty-msg'>No se encontró el grado correspondiente en el sistema.</p>";
            return;
        }

        const gradoId = gradoObj.id;

        // 2. Traer las asignaturas de este grado
        const { data: asignaturas, error: errAsig } = await db
            .from("asignaturas")
            .select("id, nombre")
            .eq("grado_id", gradoId);

        if (errAsig) throw errAsig;

        // 3. Traer las actividades publicadas para este grado
        const { data: actividades, error: errAct } = await db
            .from("actividades")
            .select(`
                *,
                asignaturas:asignatura_id (id, nombre)
            `)
            .eq("grado_id", gradoId)
            .order("fecha_limite", { ascending: true });

        if (errAct) throw errAct;

        if (!asignaturas || asignaturas.length === 0) {
            contenedorAcordeon.innerHTML = "<p class='empty-msg'>No hay asignaturas registradas para tu grado.</p>";
            return;
        }

        contenedorAcordeon.innerHTML = "";

        // 4. Construir el acordeón agrupado por asignaturas
        asignaturas.forEach(asig => {
            const tareasDeAsignatura = actividades ? actividades.filter(a => a.asignatura_id === asig.id) : [];
            const cantidadTareas = tareasDeAsignatura.length;

            const grupoDiv = document.createElement("div");
            grupoDiv.className = "materia-grupo";

            let htmlTareas = "";
            if (cantidadTareas === 0) {
                htmlTareas = `<p class="sin-tareas">No hay tareas pendientes en esta materia.</p>`;
            } else {
                tareasDeAsignatura.forEach(tarea => {
                    const fechaStr = tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString() : "Sin fecha";
                    htmlTareas += `
                        <div class="tarea-item" data-id="${tarea.id}" data-titulo="${tarea.titulo}" data-material="${tarea.archivo_url || ''}" data-comentario="${tarea.descripcion || 'Sin descripción'}" data-fecha="${tarea.fecha_limite || ''}">
                            <span>${tarea.titulo}</span>
                            <span class="badge-vencimiento">Vence: ${fechaStr}</span>
                        </div>
                    `;
                });
            }

            grupoDiv.innerHTML = `
                <button type="button" class="materia-btn">
                    <span>${asig.nombre}</span>
                    ${cantidadTareas > 0 ? `<span class="badge-notif">${cantidadTareas}</span>` : ""}
                </button>
                <div class="tareas-lista oculto">
                    ${htmlTareas}
                </div>
            `;

            // Evento para abrir/cerrar acordeón
            grupoDiv.querySelector(".materia-btn").addEventListener("click", () => {
                const lista = grupoDiv.querySelector(".tareas-lista");
                lista.classList.toggle("oculto");
            });

            contenedorAcordeon.appendChild(grupoDiv);
        });

        // Activar eventos en cada ítem de tarea para abrir el modal
        configurarModalTareas();

    } catch (err) {
        console.error("Error al cargar actividades:", err.message);
        contenedorAcordeon.innerHTML = "<p class='empty-msg'>Error al cargar las actividades.</p>";
    }
}

// Configurar Modal y manejo de clicks en tareas
function configurarModalTareas() {
    const modal = document.getElementById("modal_tarea");
    const btnCerrarModal = document.getElementById("cerrar_modal");
    const modalTitulo = document.getElementById("modal_titulo");
    const modalLinkMaterial = document.getElementById("modal_link_material");
    const modalComentario = document.getElementById("modal_comentario");
    const modalFecha = document.getElementById("modal_fecha");
    const seccionEntrega = document.getElementById("seccion_entrega");
    const mensajeVencido = document.getElementById("mensaje_vencido");

    document.querySelectorAll(".tarea-item").forEach(item => {
        item.addEventListener("click", () => {
            actividadSeleccionadaId = item.getAttribute("data-id");
            const titulo = item.getAttribute("data-titulo");
            const materialUrl = item.getAttribute("data-material");
            const comentario = item.getAttribute("data-comentario");
            const fechaLimiteStr = item.getAttribute("data-fecha");

            modalTitulo.textContent = titulo;
            modalComentario.textContent = comentario;
            modalFecha.textContent = fechaLimiteStr ? new Date(fechaLimiteStr).toLocaleString() : "Sin límite";

            if (materialUrl && materialUrl !== "null") {
                modalLinkMaterial.href = materialUrl;
                modalLinkMaterial.textContent = "Descargar material adjunto";
                modalLinkMaterial.style.display = "inline";
            } else {
                modalLinkMaterial.href = "#";
                modalLinkMaterial.textContent = "Sin material adjunto";
            }

            // Validar fecha límite
            if (fechaLimiteStr) {
                const fechaActual = new Date();
                const fechaLimite = new Date(fechaLimiteStr);
                if (fechaActual > fechaLimite) {
                    seccionEntrega.style.display = "none";
                    mensajeVencido.classList.remove("oculto");
                } else {
                    seccionEntrega.style.display = "flex";
                    mensajeVencido.classList.add("oculto");
                }
            } else {
                seccionEntrega.style.display = "flex";
                mensajeVencido.classList.add("oculto");
            }

            document.getElementById("archivo_tarea").value = "";
            modal.classList.remove("oculto");
        });
    });

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener("click", () => modal.classList.add("oculto"));
    }

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("oculto");
    });
}

// Enviar / Subir Tarea del Estudiante
document.getElementById("btn_enviar_tarea").addEventListener("click", async () => {
    const archivoInput = document.getElementById("archivo_tarea");

    if (!archivoInput.files || archivoInput.files.length === 0) {
        alert("Por favor selecciona un archivo para entregar la tarea.");
        return;
    }

    const file = archivoInput.files[0];

    try {
        const fileName = `entrega_${actividadSeleccionadaId}_${usuarioActualId}_${Date.now()}_${file.name}`;
        
        // Subir archivo al bucket 'archivos' de Supabase Storage
        const { error: uploadError } = await db.storage
            .from("archivos")
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = db.storage
            .from("archivos")
            .getPublicUrl(fileName);

        const archivoUrl = publicUrlData.publicUrl;

        // Guardar o actualizar la entrega en la tabla 'actividades_entregas'
        const { error: upsertError } = await db
            .from("actividades_entregas")
            .upsert([
                {
                    actividad_id: actividadSeleccionadaId,
                    estudiante_id: usuarioActualId,
                    archivo_url: archivoUrl,
                    fecha_entrega: new Date().toISOString()
                }
            ], { onConflict: 'actividad_id, estudiante_id' });

        if (upsertError) throw upsertError;

        alert("¡Tarea entregada con éxito!");
        document.getElementById("modal_tarea").classList.add("oculto");

    } catch (err) {
        console.error("Error al enviar tarea:", err.message);
        alert("Hubo un error al subir y entregar la tarea.");
    }
});