//const { data: { session } } = await db.auth.getSession();
//if (!session) window.location.href = "../index.html";
// Toggle del Menú lateral al pulsar el Logo
document.getElementById("logo").addEventListener("click", () => {
    document.getElementById("menu_lado").classList.toggle("oculto");
});

// Función reutilizable para eventos de los botones del menú
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
        if (urlRedireccion == "pea.html"){
            icono.addEventListener("click", () => {
                window.location.href = urlRedireccion
            });
        }else if (urlRedireccion == "profesor.html"){
            icono.addEventListener("click", () => {
                
                url = "../" + urlRedireccion
                window.location.href = url
            });
        }else {
            icono.addEventListener("click", () => {
                url = "../" + idIcono + "/" + urlRedireccion
                window.location.href = url
            })
        }
    }
}

// Configuración de interacción para todos los botones del menú
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

// Conexión Supabase
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ROL_REQUERIDO = "profesor";

let usuarioActualId = null;

// Validación de sesión y carga inicial
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
  console.log("Sesión válida PEA:", perfil.nombre);

  cargarTemasPEA();
})();

// Función para consultar los temas desde la Base de Datos
async function cargarTemasPEA() {
    try {
        const { data: temas, error } = await db
            .from("pea_temas")
            .select("*")
            .eq("profesor_id", usuarioActualId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        // Limpiar las 3 listas visuales
        for (let p = 1; p <= 3; p++) {
            document.getElementById(`lista_periodo_${p}`).innerHTML = '<li class="empty-msg">No hay temas registrados</li>';
        }

        if (temas && temas.length > 0) {
            const periodosObj = { 1: [], 2: [], 3: [] };
            temas.forEach(t => {
                if (periodosObj[t.periodo]) {
                    periodosObj[t.periodo].push(t);
                }
            });

            for (let p = 1; p <= 3; p++) {
                const listaUl = document.getElementById(`lista_periodo_${p}`);
                if (periodosObj[p].length > 0) {
                    listaUl.innerHTML = "";
                    periodosObj[p].forEach(item => {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            <span>${item.tema}</span>
                            <button class="btn-eliminar-tema" onclick="eliminarTema('${item.id}')" title="Eliminar tema">&times;</button>
                        `;
                        listaUl.appendChild(li);
                    });
                }
            }
        }
    } catch (err) {
        console.error("Error al cargar temas del PEA:", err.message);
    }
}

// Botón para añadir un tema nuevo
document.getElementById("btn_agregar_tema").addEventListener("click", async () => {
    const inputTema = document.getElementById("input_nuevo_tema");
    const selectPeriodo = document.getElementById("select_periodo");
    const textoTema = inputTema.value.trim();
    const periodoNum = parseInt(selectPeriodo.value);

    if (!textoTema) {
        alert("Por favor escribe un tema válido.");
        return;
    }

    if (!usuarioActualId) return;

    try {
        const { error } = await db
            .from("pea_temas")
            .insert([
                { profesor_id: usuarioActualId, periodo: periodoNum, tema: textoTema }
            ]);

        if (error) throw error;

        inputTema.value = "";
        cargarTemasPEA();
    } catch (err) {
        console.error("Error al guardar el tema:", err.message);
        alert("Hubo un error al guardar el tema en la base de datos.");
    }
});

// Función global para eliminar un tema
window.eliminarTema = async function(idTema) {
    if (!confirm("¿Estás seguro de eliminar este tema del PEA?")) return;

    try {
        const { error } = await db
            .from("pea_temas")
            .delete()
            .eq("id", idTema);

        if (error) throw error;

        cargarTemasPEA();
    } catch (err) {
        console.error("Error al eliminar el tema:", err.message);
        alert("No se pudo eliminar el tema.");
    }
};