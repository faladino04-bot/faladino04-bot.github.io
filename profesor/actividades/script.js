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
        if (urlRedireccion == "actividades.html"){
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
    console.log("Sesión activa Actividades:", perfil.nombre);

    await cargarFiltrosProfesor();
    await cargarActividades();
})();

// Cargar Grados y Asignaturas del Profesor
async function cargarFiltrosProfesor() {
    const selectGrado = document.getElementById("select_grado");
    const selectAsignatura = document.getElementById("select_asignatura");
    const selectPeaTema = document.getElementById("select_pea_tema");

    try {
        const { data: asignaturas, error } = await db
            .from("asignaturas")
            .select(`
                id,
                nombre,
                grado_id,
                grados:grado_id (id, nombre)
            `)
            .eq("profesor_id", usuarioActualId);

        if (error) throw error;

        if (!asignaturas || asignaturas.length === 0) return;

        // Extraer grados únicos
        const gradosMap = new Map();
        const asignaturasList = [];

        asignaturas.forEach(item => {
            if (item.grados) {
                gradosMap.set(item.grados.id, item.grados.nombre);
            }
            asignaturasList.push(item);
        });

        selectGrado.innerHTML = '<option value="">Seleccione un grado</option>';
        gradosMap.forEach((nombre, id) => {
            selectGrado.innerHTML += `<option value="${id}">Grado ${nombre}</option>`;
        });

        // Evento cambio de Grado
        selectGrado.addEventListener("change", async () => {
            const gradoId = selectGrado.value;
            selectAsignatura.innerHTML = '<option value="">Seleccione asignatura</option>';
            selectPeaTema.innerHTML = '<option value="">Seleccione un tema (Opcional)</option>';

            if (!gradoId) return;

            // Filtrar asignaturas del grado seleccionado
            const asigsFiltradas = asignaturasList.filter(a => a.grado_id === gradoId);
            asigsFiltradas.forEach(a => {
                selectAsignatura.innerHTML += `<option value="${a.id}">${a.nombre}</option>`;
            });

            // Cargar Temas del PEA para este grado y profesor
            const { data: temasPEA } = await db
                .from("pea_temas")
                .select("id, tema, periodo")
                .eq("profesor_id", usuarioActualId)
                .eq("grado_id", gradoId);

            if (temasPEA && temasPEA.length > 0) {
                temasPEA.forEach(t => {
                    selectPeaTema.innerHTML += `<option value="${t.id}">[P${t.periodo}] ${t.tema}</option>`;
                });
            }
        });

    } catch (err) {
        console.error("Error al cargar filtros:", err.message);
    }
}

// Publicar Actividad
document.getElementById("form_crear_actividad").addEventListener("submit", async (e) => {
    e.preventDefault();

    const gradoId = document.getElementById("select_grado").value;
    const asignaturaId = document.getElementById("select_asignatura").value;
    const peaTemaId = document.getElementById("select_pea_tema").value || null;
    const titulo = document.getElementById("input_titulo").value.trim();
    const fechaLimite = document.getElementById("input_fecha_limite").value;
    const descripcion = document.getElementById("input_descripcion").value.trim();
    const archivoInput = document.getElementById("input_archivo");

    let archivoUrl = null;

    try {
        // Subir archivo si fue seleccionado
        if (archivoInput.files.length > 0) {
            const file = archivoInput.files[0];
            const fileName = `actividad_${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await db.storage
                .from("archivos")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = db.storage
                .from("archivos")
                .getPublicUrl(fileName);

            archivoUrl = publicUrlData.publicUrl;
        }

        // Insertar en la base de datos
        const { error } = await db.from("actividades").insert([{
            profesor_id: usuarioActualId,
            grado_id: gradoId,
            asignatura_id: asignaturaId,
            pea_tema_id: peaTemaId,
            titulo: titulo,
            descripcion: descripcion,
            archivo_url: archivoUrl,
            fecha_limite: fechaLimite
        }]);

        if (error) throw error;

        alert("¡Actividad publicada con éxito!");
        document.getElementById("form_crear_actividad").reset();
        cargarActividades();

    } catch (err) {
        console.error("Error al publicar actividad:", err.message);
        alert("Hubo un error al publicar la actividad.");
    }
});

// Cargar Listado de Actividades
async function cargarActividades() {
    const contenedor = document.getElementById("contenedor_actividades");
    contenedor.innerHTML = "<p class='empty-msg'>Cargando...</p>";

    try {
        const { data: actividades, error } = await db
            .from("actividades")
            .select(`
                *,
                grados:grado_id (nombre),
                asignaturas:asignatura_id (nombre),
                pea_temas:pea_tema_id (tema, periodo)
            `)
            .eq("profesor_id", usuarioActualId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        if (!actividades || actividades.length === 0) {
            contenedor.innerHTML = "<p class='empty-msg'>No has publicado ninguna actividad todavía.</p>";
            return;
        }

        contenedor.innerHTML = "";
        actividades.forEach(act => {
            const gradoNombre = act.grados ? act.grados.nombre : "N/A";
            const asigNombre = act.asignaturas ? act.asignaturas.nombre : "General";
            const temaTexto = act.pea_temas ? ` | Tema: ${act.pea_temas.tema}` : "";
            const fechaStr = act.fecha_limite ? new Date(act.fecha_limite).toLocaleString() : "Sin límite";

            const div = document.createElement("div");
            div.className = "actividad-item";
            div.innerHTML = `
                <div class="actividad-info">
                    <h4>${act.titulo}</h4>
                    <p>${act.descripcion || "Sin descripción"}</p>
                    <div class="actividad-meta">
                        <span><strong>Grado:</strong> ${gradoNombre}</span>
                        <span><strong>Asignatura:</strong> ${asigNombre}</span>
                        <span><strong>Límite:</strong> ${fechaStr}</span>
                        ${act.archivo_url ? `<a href="${act.archivo_url}" target="_blank" style="color: #037EF5; font-weight: bold;">Ver Archivo Adjunto</a>` : ""}
                    </div>
                    <small style="color: #0284c7; margin-top: 4px;">${temaTexto}</small>
                </div>
                <button class="btn-secundario" onclick="abrirRespuestas('${act.id}', '${act.titulo.replace(/'/g, "\\'")}')">Ver Respuestas</button>
            `;
            contenedor.appendChild(div);
        });

    } catch (err) {
        console.error("Error al cargar actividades:", err.message);
        contenedor.innerHTML = "<p class='empty-msg'>Error al cargar el listado.</p>";
    }
}

// Funcionalidad Modal Ver Respuestas
window.abrirRespuestas = async function(actividadId, tituloActividad) {
    const modal = document.getElementById("modal_respuestas");
    const tituloModal = document.getElementById("modal_titulo_actividad");
    const cuerpoTabla = document.getElementById("cuerpo_tabla_respuestas");

    tituloModal.textContent = `Entregas para: ${tituloActividad}`;
    cuerpoTabla.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Cargando entregas...</td></tr>";
    modal.classList.remove("oculto");

    try {
        // Obtener entregas de los estudiantes vinculados a la actividad
        const { data: entregas, error } = await db
            .from("actividades_entregas")
            .select(`
                id,
                nota,
                comentario,
                archivo_url,
                fecha_entrega,
                perfiles:estudiante_id (nombre)
            `)
            .eq("actividad_id", actividadId);

        if (error) throw error;

        if (!entregas || entregas.length === 0) {
            cuerpoTabla.innerHTML = "<tr><td colspan='4' style='text-align:center; color: #777;'>Ningún estudiante ha enviado esta actividad aún.</td></tr>";
            return;
        }

        cuerpoTabla.innerHTML = "";
        entregas.forEach(ent => {
            const nombreEstudiante = ent.perfiles ? ent.perfiles.nombre : "Estudiante desconocido";
            const fechaStr = new Date(ent.fecha_entrega).toLocaleString();
            const archivoLink = ent.archivo_url ? `<a href="${ent.archivo_url}" target="_blank">Ver Archivo</a>` : "Sin archivo";
            const comentarioText = ent.comentario || "Sin comentario";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${nombreEstudiante}</strong></td>
                <td>${fechaStr}</td>
                <td>${archivoLink}<br><small style="color:#555;">${comentarioText}</small></td>
                <td>
                    <input type="number" step="0.1" min="0" max="5" class="input-nota" value="${ent.nota !== null ? ent.nota : ''}" onchange="actualizarNota('${ent.id}', this.value)">
                </td>
            `;
            cuerpoTabla.appendChild(tr);
        });

    } catch (err) {
        console.error("Error al cargar respuestas:", err.message);
        cuerpoTabla.innerHTML = "<tr><td colspan='4' style='text-align:center; color: red;'>Error al cargar las respuestas.</td></tr>";
    }
};

// Actualizar Nota en tiempo real al cambiar el input
window.actualizarNota = async function(entregaId, nuevaNota) {
    try {
        const notaValor = nuevaNota === "" ? null : parseFloat(nuevaNota);
        const { error } = await db
            .from("actividades_entregas")
            .update({ nota: notaValor })
            .eq("id", entregaId);

        if (error) throw error;
        console.log("Nota actualizada correctamente");
    } catch (err) {
        console.error("Error al actualizar la nota:", err.message);
        alert("No se pudo guardar la calificación.");
    }
};

// Cerrar Modal
document.getElementById("cerrar_modal").addEventListener("click", () => {
    document.getElementById("modal_respuestas").classList.add("oculto");
});