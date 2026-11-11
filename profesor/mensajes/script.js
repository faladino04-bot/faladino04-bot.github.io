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
        }else if (urlRedireccion == "profesor.html"){
            icono.addEventListener("click", () => {
                url = "../" + urlRedireccion;
                window.location.href = url;
            });
        }else{
            icono.addEventListener("click", () => {
                url = "../" + idIcono + "/" + urlRedireccion;
                window.location.href = url;
            });
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

const ROL_REQUERIDO = "profesor";
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
  console.log("Sesión válida profesor:", perfil.nombre);

  await cargarChatsRecientes();
  await inicializarBuscadorEstudiantes();
})();

// --- 1. BUSCADOR DE ESTUDIANTES ---
async function inicializarBuscadorEstudiantes() {
    const inputBuscar = document.getElementById("input_buscar_estudiante");
    const dropdown = document.getElementById("resultados_busqueda_estudiantes");

    if (!inputBuscar || !dropdown) return;

    const ejecutarBusqueda = async () => {
        const texto = inputBuscar.value.trim().toLowerCase();
        if (texto.length < 1) {
            dropdown.classList.add("oculto");
            return;
        }

        try {
            // Buscar estudiantes en la tabla perfiles
            const { data: estudiantes, error } = await db
                .from("perfiles")
                .select("id, nombre, rol")
                .eq("rol", "estudiante")
                .ilike("nombre", `%${texto}%`)
                .limit(10);

            if (error) throw error;

            dropdown.innerHTML = "";

            if (!estudiantes || estudiantes.length === 0) {
                dropdown.innerHTML = `<div class="search-result-item" style="color:#777; justify-content:center;">No se encontraron estudiantes</div>`;
            } else {
                estudiantes.forEach(est => {
                    const item = document.createElement("div");
                    item.className = "search-result-item";
                    item.innerHTML = `
                        <span><strong>${est.nombre}</strong></span>
                        <button type="button">Enviar mensaje</button>
                    `;
                    item.querySelector("button").addEventListener("click", () => {
                        abrirChatCon({ id: est.id, nombre: est.nombre });
                        inputBuscar.value = "";
                        dropdown.classList.add("oculto");
                    });
                    dropdown.appendChild(item);
                });
            }
            dropdown.classList.remove("oculto");

        } catch (err) {
            console.error("Error al buscar estudiantes:", err.message);
        }
    };

    inputBuscar.addEventListener("input", ejecutarBusqueda);
    inputBuscar.addEventListener("focus", ejecutarBusqueda);

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
        const { data: msgs, error } = await db
            .from("mensajes")
            .select("remitente_id, destinatario_id, created_at")
            .or(`remitente_id.eq.${usuarioActualId},destinatario_id.eq.${usuarioActualId}`)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const idsContactos = new Set();
        msgs.forEach(m => {
            if (m.remitente_id !== usuarioActualId) idsContactos.add(m.remitente_id);
            if (m.destinatario_id !== usuarioActualId) idsContactos.add(m.destinatario_id);
        });

        if (idsContactos.size === 0) {
            listaRecientesEl.innerHTML = `<p class="empty-chats">No hay chats recientes.</p>`;
            return;
        }

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
async function abrirChatCon(contacto) {
    destinatarioActivo = contacto;
    
    document.getElementById("chat_placeholder").style.display = "none";
    document.getElementById("chat_activo_container").classList.remove("oculto");
    document.getElementById("chat_nombre_destinatario").textContent = contacto.nombre;

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
            bubble.textContent = m.contenido; // Usando 'contenido' tal como está en tu tabla
            scrollArea.appendChild(bubble);
        });

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
                contenido: texto // Usando 'contenido'
            }]);

        if (error) throw error;

        inputMensaje.value = "";
        await cargarMensajesConversacion();
        await cargarChatsRecientes();

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