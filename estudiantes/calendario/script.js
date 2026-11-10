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

// Configuración de interacción para todos los botones del menú
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
  window.location.href = "../index.html";
  return;
});

// Protección de sesión con Supabase
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "estudiante";

(async () => {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = "../index.html";
    return;
  }

  const { data: perfil } = await db
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", session.user.id)
    .single();

  if (!perfil || perfil.rol !== ROL_REQUERIDO) {
    await db.auth.signOut();
    window.location.href = "../index.html";
    return;
  }

  console.log("Sesión válida:", perfil.nombre);
})();

// --- LÓGICA DEL CALENDARIO INTERACTIVO ---

let fechaActual = new Date(); // Toma la fecha actual (Año 2026)
let diaSeleccionadoStr = null;

// Base de datos simulada de eventos (Tareas de ejemplo + Notas personales)
// Formato de clave: "YYYY-MM-DD"
let eventosBD = {
    "2026-11-15": [{ tipo: "tarea", texto: "Entrega: Ejercicios de Ecuaciones" }],
    "2026-11-10": [{ tipo: "tarea", texto: "Entrega: Taller de Fracciones" }],
    "2026-11-20": [{ tipo: "tarea", texto: "Entrega: Maqueta Celular" }]
};

const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function renderizarCalendario() {
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    // Actualizar título del mes
    document.getElementById("mes_anio_actual").textContent = `${mesesNombres[mes]} ${anio}`;

    const primerDiaIndex = new Date(anio, mes, 1).getDay();
    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    const primerDiaLunes = (primerDiaIndex === 0) ? 6 : primerDiaIndex - 1;
    
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();

    const contenedorDias = document.getElementById("calendar_days");
    contenedorDias.innerHTML = "";

    // 1. Días del mes anterior (relleno)
    for (let i = primerDiaLunes; i > 0; i--) {
        const diaDiv = document.createElement("div");
        diaDiv.classList.add("day-cell", "other-month");
        diaDiv.textContent = ultimoDiaMesAnterior - i + 1;
        contenedorDias.appendChild(diaDiv);
    }

    // 2. Días del mes actual
    for (let i = 1; i <= ultimoDia; i++) {
        const diaDiv = document.createElement("div");
        diaDiv.classList.add("day-cell");
        
        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(i).padStart(2, '0');
        const fechaClave = `${anio}-${mesStr}-${diaStr}`;

        diaDiv.innerHTML = `<span>${i}</span>`;

        // Verificar si hay eventos en este día para poner los puntos indicadores
        if (eventosBD[fechaClave]) {
            const indicadoresDiv = document.createElement("div");
            indicadoresDiv.classList.add("day-indicators");
            
            let tieneTarea = eventosBD[fechaClave].some(e => e.tipo === "tarea");
            let tieneNota = eventosBD[fechaClave].some(e => e.tipo === "nota");

            if (tieneTarea) {
                const puntoT = document.createElement("div");
                puntoT.classList.add("dot-tarea");
                indicadoresDiv.appendChild(puntoT);
            }
            if (tieneNota) {
                const puntoN = document.createElement("div");
                puntoN.classList.add("dot-nota");
                indicadoresDiv.appendChild(puntoN);
            }
            diaDiv.appendChild(indicadoresDiv);
        }

        // Evento al hacer clic en el día
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

    if (eventosBD[fechaClave] && eventosBD[fechaClave].length > 0) {
        eventosBD[fechaClave].forEach(evento => {
            const item = document.createElement("div");
            item.classList.add("event-item", evento.tipo);
            item.textContent = evento.texto;
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

// Guardar nota personal del estudiante
document.getElementById("btn_guardar_nota").addEventListener("click", () => {
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

    // Inicializa el array de ese día si no existe
    if (!eventosBD[diaSeleccionadoStr]) {
        eventosBD[diaSeleccionadoStr] = [];
    }

    // Añade la nota personal
    eventosBD[diaSeleccionadoStr].push({ tipo: "nota", texto: textoNota });
    inputNota.value = "";

    // Actualiza la vista del calendario y del panel lateral
    renderizarCalendario();
    
    // Refresca la selección actual
    const [a, m, d] = diaSeleccionadoStr.split("-");
    seleccionarDia(diaSeleccionadoStr, parseInt(d), mesesNombres[parseInt(m)-1], a);
});

// Inicializar el calendario al cargar
renderizarCalendario();