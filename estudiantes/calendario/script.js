// ==========================================
// 1. MENÚ LATERAL Y NAVEGACIÓN
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
        if (urlRedireccion == "calendario.html"){
            icono.addEventListener("click", () => {
                window.location.href = urlRedireccion;
            });
        }else if (urlRedireccion == "estudiante.html"){
            icono.addEventListener("click", () => {
                url = ".."+"/"+urlRedireccion
                window.location.href = url
            });
        }else{
            icono.addEventListener("click", () => {
                url = "../"+idIcono+"/"+urlRedireccion
                window.location.href = url
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
// 2. PROTECCIÓN DE SESIÓN Y CALENDARIO
// ==========================================
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "estudiante";

let fechaActual = new Date(); 
let diaSeleccionadoStr = null;
let notasUsuarioBD = {}; 

const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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
  
  // Cargar notas de la BD al iniciar correctamente la sesión
  await cargarNotasCalendario();
})();

// Cargar notas desde Supabase
async function cargarNotasCalendario() {
    try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) return;

        const { data, error } = await db
            .from("calendario_notas")
            .select("*")
            .eq("estudiante_id", session.user.id);

        if (error) throw error;

        notasUsuarioBD = {};
        if (data) {
            data.forEach(item => {
                if (!notasUsuarioBD[item.fecha]) {
                    notasUsuarioBD[item.fecha] = [];
                }
                notasUsuarioBD[item.fecha].push({ id: item.id, tipo: item.tipo, texto: item.texto });
            });
        }
        renderizarCalendario();
    } catch (err) {
        console.error("Error al cargar notas del calendario:", err.message);
    }
}

function renderizarCalendario() {
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    document.getElementById("mes_anio_actual").textContent = `${mesesNombres[mes]} ${anio}`;

    const primerDiaIndex = new Date(anio, mes, 1).getDay();
    const primerDiaLunes = (primerDiaIndex === 0) ? 6 : primerDiaIndex - 1;
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();

    const contenedorDias = document.getElementById("calendar_days");
    contenedorDias.innerHTML = "";

    // Días mes anterior
    for (let i = primerDiaLunes; i > 0; i--) {
        const diaDiv = document.createElement("div");
        diaDiv.classList.add("day-cell", "other-month");
        diaDiv.textContent = ultimoDiaMesAnterior - i + 1;
        contenedorDias.appendChild(diaDiv);
    }

    // Días mes actual
    for (let i = 1; i <= ultimoDia; i++) {
        const diaDiv = document.createElement("div");
        diaDiv.classList.add("day-cell");
        
        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(i).padStart(2, '0');
        const fechaClave = `${anio}-${mesStr}-${diaStr}`;

        diaDiv.innerHTML = `<span>${i}</span>`;

        if (notasUsuarioBD[fechaClave] && notasUsuarioBD[fechaClave].length > 0) {
            const indicadoresDiv = document.createElement("div");
            indicadoresDiv.classList.add("day-indicators");
            
            let tieneNota = notasUsuarioBD[fechaClave].some(e => e.tipo === "nota");
            if (tieneNota) {
                const puntoN = document.createElement("div");
                puntoN.classList.add("dot-nota");
                indicadoresDiv.appendChild(puntoN);
            }
            diaDiv.appendChild(indicadoresDiv);
        }

        diaDiv.addEventListener("click", () => {
            document.querySelectorAll(".day-cell").forEach(d => d.classList.remove("selected"));
            diaDiv.classList.add("selected");
            seleccionarDia(fechaClave, i, mesesNombres[mes], anio);
        });

        contenedorDias.appendChild(diaDiv);
    }
}

function seleccionarDia(fechaClave, diaNum, mesNombre, anioNum) {
    diaSeleccionadoStr = fechaClave;
    document.getElementById("fecha_seleccionada").textContent = `${diaNum} de ${mesNombre} de ${anioNum}`;
    
    const listaEventos = document.getElementById("lista_eventos_dia");
    listaEventos.innerHTML = "";

    if (notasUsuarioBD[fechaClave] && notasUsuarioBD[fechaClave].length > 0) {
        notasUsuarioBD[fechaClave].forEach(evento => {
            const item = document.createElement("div");
            item.classList.add("event-item", evento.tipo);
            item.style.cssText = "display: flex; justify-content: space-between; align-items: center;";
            
            const spanTexto = document.createElement("span");
            spanTexto.textContent = evento.texto;
            item.appendChild(spanTexto);

            // Botón de eliminar si es una nota propia guardada en BD
            if (evento.id) {
                const btnEliminar = document.createElement("button");
                btnEliminar.textContent = "❌";
                btnEliminar.style.cssText = "background: none; border: none; cursor: pointer; font-size: 0.8rem;";
                btnEliminar.title = "Eliminar nota";
                btnEliminar.onclick = async () => {
                    if (confirm("¿Deseas eliminar esta nota?")) {
                        await eliminarNotaCalendario(evento.id, fechaClave);
                    }
                };
                item.appendChild(btnEliminar);
            }

            listaEventos.appendChild(item);
        });
    } else {
        listaEventos.innerHTML = `<p class="no-events">No hay eventos para este día.</p>`;
    }
}

// Botones de cambio de mes
document.getElementById("mes_anterior").addEventListener("click", () => {
    fechaActual.setMonth(fechaActual.getMonth() - 1);
    renderizarCalendario();
});

document.getElementById("mes_siguiente").addEventListener("click", () => {
    fechaActual.setMonth(fechaActual.getMonth() + 1);
    renderizarCalendario();
});

// Guardar nota personal en Supabase
document.getElementById("btn_guardar_nota").addEventListener("click", async () => {
    const inputNota = document.getElementById("input_titulo_nota");
    const textoNota = inputNota.value.trim();

    if (!diaSeleccionadoStr) {
        alert("Por favor, selecciona un día en el calendario primero.");
        return;
    }
    if (!textoNota) {
        alert("Escribe una descripción para la nota.");
        return;
    }

    try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) return;

        const { error } = await db
            .from("calendario_notas")
            .insert([{
                estudiante_id: session.user.id,
                fecha: diaSeleccionadoStr,
                texto: textoNota,
                tipo: "nota"
            }]);

        if (error) throw error;

        inputNota.value = "";
        await cargarNotasCalendario();

        const [a, m, d] = diaSeleccionadoStr.split("-");
        seleccionarDia(diaSeleccionadoStr, parseInt(d), mesesNombres[parseInt(m)-1], a);

    } catch (err) {
        alert("Error al guardar la nota: " + err.message);
    }
});

// Función para eliminar nota de Supabase
async function eliminarNotaCalendario(idNota, fechaClave) {
    try {
        const { error } = await db
            .from("calendario_notas")
            .delete()
            .eq("id", idNota);

        if (error) throw error;

        await cargarNotasCalendario();

        const [a, m, d] = fechaClave.split("-");
        seleccionarDia(fechaClave, parseInt(d), mesesNombres[parseInt(m)-1], a);
    } catch (err) {
        alert("Error al eliminar la nota: " + err.message);
    }
}