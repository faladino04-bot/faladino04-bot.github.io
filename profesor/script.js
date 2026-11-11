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
        if (urlRedireccion == "profesor.html"){
            icono.addEventListener("click", () => {
                window.location.href = urlRedireccion;
            });
        }else if (urlRedireccion){
            icono.addEventListener("click", () => {
                url = idIcono + "/" + urlRedireccion;
                window.location.href = url;
            });
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
  document.getElementById("mcerrar").style.backgroundColor = "#037EF5";
});

document.getElementById("cerrar").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_cerrar").classList.add("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "transparent";
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

const ROL_REQUERIDO = "profesor";


// Verificación única de sesión y arranque de funciones de la vista
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

  // Cargar el horario del profesor autenticado pasando su ID
  cargarHorarioProfesorLogueado(session.user.id);
})();
// Cargar el horario del profesor autenticado
async function cargarHorarioProfesorLogueado(profesorId) {
    const cuerpoHorario = document.getElementById("cuerpo_horario");
    if (!cuerpoHorario) return;

    // Generar filas de 6:00 a 22:00
    const horas = [];
    for (let h = 6; h <= 22; h++) {
        const hStr = h < 10 ? `0${h}:00` : `${h}:00`;
        horas.push(hStr);
    }

    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

    try {
        const { data: bloques, error } = await db
            .from("horarios")
            .select("*")
            .eq("profesor_id", profesorId);

        if (error) throw error;

        // Mapear bloques por "hora_dia"
        const mapaHorario = {};
        if (bloques) {
            bloques.forEach(b => {
                mapaHorario[`${b.hora}_${b.dia}`] = `${b.materia} (${b.grado})`;
            });
        }

        cuerpoHorario.innerHTML = "";
        horas.forEach(hora => {
            const tr = document.createElement("tr");
            
            // Columna de hora am/pm
            const horaAmPm = parseInt(hora) === 12 ? '12:00 p.m.' : parseInt(hora) > 12 ? `${parseInt(hora) - 12}:00 p.m.` : `${parseInt(hora)}:00 a.m.`;
            let htmlRow = `<td style="font-weight:bold; background:#f8fafc;">${horaAmPm}</td>`;

            dias.forEach(dia => {
                const contenidoClase = mapaHorario[`${hora}_${dia}`] || "";
                htmlRow += `<td style="text-align:center; padding:8px; border:1px solid #ddd;">${contenidoClase}</td>`;
            });

            tr.innerHTML = htmlRow;
            cuerpoHorario.appendChild(tr);
        });

    } catch (err) {
        console.error("Error al cargar el horario del profesor:", err.message);
    }
}