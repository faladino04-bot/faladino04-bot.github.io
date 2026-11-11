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
        if (urlRedireccion == "mensajes.html"){
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
// PROTECCIÓN DE SESIÓN Y LÓGICA DE CHAT
// ==========================================
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "estudiante";
let usuarioActualId = null;
let destinatarioActivo = null; // { id, nombre }

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
  console.log("Sesión válida estudiante:", perfil.nombre);

  // Inicializar funciones del chat
// Inicializar funciones del chat con el filtro de grado
    await cargarChatsRecientes();
    await inicializarBuscadorProfesoresConFiltro();
})();

// --- 1. BUSCADOR DE PROFESORES FILTRADO POR GRADO ---
let gradoEstudianteActual = null;

async function inicializarBuscadorProfesoresConFiltro() {
    const inputBuscar = document.getElementById("input_buscar_profesor");
    const dropdown = document.getElementById("resultados_busqueda_profesores");

    if (!inputBuscar || !dropdown) return;

    // 1. Obtener el grado del estudiante logueado actual
    try {
        const { data: perfilData } = await db
            .from("perfiles")
            .select("grado")
            .eq("id", usuarioActualId)
            .single();

        if (perfilData) {
            gradoEstudianteActual = perfilData.grado;
        }
    } catch (err) {
        console.error("Error al obtener grado del estudiante:", err.message);
    }

    inputBuscar.addEventListener("input", async (e) => {
        const texto = e.target.value.trim().toLowerCase();
        if (!texto) {
            dropdown.classList.add("oculto");
            dropdown.innerHTML = "";
            return;
        }

        try {
            // 2. Si el estudiante tiene un grado asignado, buscamos las asignaturas de ese grado
            let profesoresValidosIds = [];
            if (gradoEstudianteActual) {
                // Primero buscamos el ID del grado en la tabla 'grados' (o filtramos directo si grado es el nombre)
                const { data: gradoObj } = await db
                    .from("grados")
                    .select("id")
                    .eq("nombre", gradoEstudianteActual)
                    .single();

                if (gradoObj) {
                    // Buscamos las asignaturas que pertenecen a este grado
                    const { data: asignaturasGrado } = await db
                        .from("asignaturas")
                        .select("profesor_id")
                        .eq("grado_id", gradoObj.id);

                    if (asignaturasGrado) {
                        profesoresValidosIds = asignaturasGrado.map(a => a.profesor_id).filter(Boolean);
                    }
                }
            }

            // 3. Consultamos los perfiles de tipo 'profesor' que coincidan con el texto escrito
            let query = db
                .from("perfiles")
                .select("id, nombre")
                .eq("rol", "profesor")
                .ilike("nombre", `%${texto}%`);

            // Si encontramos profesores que dan clase en su grado, filtramos por ellos
            if (profesoresValidosIds.length > 0) {
                query = query.in("id", profesoresValidosIds);
            } else {
                // Si por alguna razón no hay asignaturas configuradas para ese grado, no devolvemos resultados
                dropdown.innerHTML = `<div class="search-result-item" style="color:#777; justify-content:center;">No hay profesores para tu grado</div>`;
                dropdown.classList.remove("oculto");
                return;
            }

            const { data: profs, error } = await query;
            if (error) throw error;

            dropdown.innerHTML = "";
            if (!profs || profs.length === 0) {
                dropdown.innerHTML = `<div class="search-result-item" style="color:#777; justify-content:center;">No se encontraron profesores de tu grado</div>`;
            } else {
                profs.forEach(p => {
                    const item = document.createElement("div");
                    item.className = "search-result-item";
                    item.innerHTML = `
                        <span><strong>${p.nombre}</strong> <small style="color:#037EF5;">(Tu profesor)</small></span>
                        <button type="button">Enviar mensaje</button>
                    `;
                    item.querySelector("button").addEventListener("click", () => {
                        abrirChatCon({ id: p.id, nombre: p.nombre });
                        inputBuscar.value = "";
                        dropdown.classList.add("oculto");
                    });
                    dropdown.appendChild(item);
                });
            }
            dropdown.classList.remove("oculto");

        } catch (err) {
            console.error("Error en la búsqueda filtrada de profesores:", err.message);
        }
    });

    // Ocultar dropdown al hacer click fuera
    document.addEventListener("click", (e) => {
        if (!inputBuscar.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("oculto");
        }
    });
}

// --- 2. CARGAR CHATS RECIENTES ---
async function cargarChatsRecientes() {
    const listaRecientesEl = document.getElementById("lista_chats_recientes");
    
    try {
        // Obtenemos los mensajes donde el usuario actual participa
        const { data: msgs, error } = await db
            .from("mensajes")
            .select("remitente_id, destinatario_id, created_at")
            .or(`remitente_id.eq.${usuarioActualId},destinatario_id.eq.${usuarioActualId}`)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Extraer IDs únicos de las personas con las que ha chateado
        const idsContactos = new Set();
        msgs.forEach(m => {
            if (m.remitente_id !== usuarioActualId) idsContactos.add(m.remitente_id);
            if (m.destinatario_id !== usuarioActualId) idsContactos.add(m.destinatario_id);
        });

        if (idsContactos.size === 0) {
            listaRecientesEl.innerHTML = `<p class="empty-chats">No hay chats recientes.</p>`;
            return;
        }

        // Buscar información de esos perfiles
        const { data: perfilesContactos, error: errPerfiles } = await db
            .from("perfiles")
            .select("id, nombre")
            .in("id", Array.from(idsContactos));

        if (errPerfiles) throw errPerfiles;

        listaRecientesEl.innerHTML = "";
        perfilesContactos.forEach(contacto => {
            const div = document.createElement("div");
            div.className = "recent-chat-item";
            div.innerHTML = `
                <img src="../../imagenes/iconos/usuario.png" width="30" height="30" style="object-fit:contain;">
                <span class="recent-chat-name">${contacto.nombre}</span>
            `;
            div.addEventListener("click", () => {
                document.querySelectorAll(".recent-chat-item").forEach(el => el.classList.remove("active"));
                div.classList.add("active");
                abrirChatCon({ id: contacto.id, nombre: contacto.nombre });
            });
            listaRecientesEl.appendChild(div);
        });

    } catch (err) {
        console.error("Error al cargar chats recientes:", err.message);
    }
}

// --- 3. ABRIR CHAT Y CARGAR MENSAJES ---
async function abrirChatCon(profesor) {
    destinatarioActivo = profesor;
    
    document.getElementById("chat_placeholder").style.display = "none";
    document.getElementById("chat_activo_container").classList.remove("oculto");
    document.getElementById("chat_nombre_destinatario").textContent = profesor.nombre;

    await cargarMensajesConversacion();
}

async function cargarMensajesConversacion() {
    if (!destinatarioActivo) return;
    const scrollArea = document.getElementById("mensajes_scroll_area");

    try {
        const { data: mensajes, error } = await db
            .from("mensajes")
            .select("*")
            .or(`and(remitente_id.eq.${usuarioActualId},destinatario_id.eq.${destinatarioActivo.id}),and(remitente_id.eq.${destinatarioActivo.id},destinatario_id.eq.${usuarioActualId})`)
            .order("created_at", { ascending: true });

        if (error) throw error;

        scrollArea.innerHTML = "";
        if (mensajes.length === 0) {
            scrollArea.innerHTML = `<p style="text-align:center; color:#888; font-style:italic; margin-top:20px;">Envía un mensaje para iniciar la conversación con ${destinatarioActivo.nombre}</p>`;
            return;
        }

        mensajes.forEach(m => {
            const bubble = document.createElement("div");
            bubble.className = `message-bubble ${m.remitente_id === usuarioActualId ? 'enviado' : 'recibido'}`;
            bubble.textContent = m.contenido;
            scrollArea.appendChild(bubble);
        });

        // Bajar scroll automáticamente al último mensaje
        scrollArea.scrollTop = scrollArea.scrollHeight;

    } catch (err) {
        console.error("Error al cargar mensajes:", err.message);
    }
}

// --- 4. ENVIAR MENSAJE ---
const btnEnviar = document.getElementById("btn_enviar_mensaje");
const inputMensaje = document.getElementById("input_nuevo_mensaje");

async function enviarMensajeActual() {
    const texto = inputMensaje.value.trim();
    if (!texto || !destinatarioActivo || !usuarioActualId) return;

    try {
        const { error } = await db
            .from("mensajes")
            .insert([{
                remitente_id: usuarioActualId,
                destinatario_id: destinatarioActivo.id,
                contenido: texto
            }]);

        if (error) throw error;

        inputMensaje.value = "";
        await cargarMensajesConversacion();
        await cargarChatsRecientes(); // Actualizar barra lateral

    } catch (err) {
        alert("Error al enviar mensaje: " + err.message);
    }
}

if (btnEnviar && inputMensaje) {
    btnEnviar.addEventListener("click", enviarMensajeActual);
    inputMensaje.addEventListener("keypress", (e) => {
        if (e.key === "Enter") enviarMensajeActual();
    });
}