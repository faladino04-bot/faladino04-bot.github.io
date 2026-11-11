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
        if (urlRedireccion == "estudiante.html"){
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

configurarBotonMenu("home", "texto_home", "mhome", "estudiante.html");
configurarBotonMenu("usuario", "texto_usuario", "musuario", "usuario.html");
configurarBotonMenu("estadisticas", "texto_estadisticas", "mestadisticas", "estadisticas.html");
configurarBotonMenu("actividades", "texto_actividades", "mactividades", "actividades.html");
configurarBotonMenu("examenes", "texto_examenes", "mexamenes", "examenes.html");
configurarBotonMenu("anuncios", "texto_anuncios", "manuncios", "anuncios.html");
configurarBotonMenu("mensajes", "texto_mensajes", "mmensajes", "mensajes.html");
configurarBotonMenu("calendario", "texto_calendario", "mcalendario", "calendario.html");

const btnCerrar = document.getElementById("cerrar");
if (btnCerrar) {
    btnCerrar.addEventListener("mouseenter", () => {
        document.getElementById("texto_cerrar").classList.remove("oculto");
        document.getElementById("mcerrar").style.backgroundColor = "#037EF5";
    });
    btnCerrar.addEventListener("mouseleave", () => {
        document.getElementById("texto_cerrar").classList.add("oculto");
        document.getElementById("mcerrar").style.backgroundColor = "transparent";
    });
    btnCerrar.addEventListener("click", async () => {
        await db.auth.signOut();
        window.location.href = "../index.html";
    });
}

// ==========================================
// 2. SUPABASE Y VALIDACIÓN DE SESIÓN
// ==========================================
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "estudiante";

document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
        window.location.href = "../index.html";
        return;
    }

    const { data: perfil } = await db
        .from("perfiles")
        .select("id, nombre, rol, grado")
        .eq("id", session.user.id)
        .single();

    if (!perfil || perfil.rol !== ROL_REQUERIDO) {
        await db.auth.signOut();
        window.location.href = "../index.html";
        return;
    }

    const bienvenidaEl = document.getElementById("bienvenida");
    if (bienvenidaEl) bienvenidaEl.textContent = `Bienvenido, ${perfil.nombre}`;

    // Cargar boletín de notas dinámico
    await cargarBoletinEstudiante(session.user.id, perfil.grado);

    // Configurar botón de descarga PDF
    configurarBotonPDF();
});

// ==========================================
// 3. CARGAR BOLETIN Y CALCULAR PROMEDIOS
// ==========================================
async function cargarBoletinEstudiante(estudianteId, gradoNombre) {
    const tbody = document.getElementById("cuerpo_tabla_notas");
    if (!tbody) return;

    try {
        const { data: gradoObj } = await db
            .from("grados")
            .select("id")
            .ilike("nombre", `%${gradoNombre}%`)
            .single();

        if (!gradoObj) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">No se encontró tu grado registrado.</td></tr>`;
            return;
        }

        const gradoId = gradoObj.id;

        const { data: asignaturas } = await db
            .from("asignaturas")
            .select("id, nombre")
            .eq("grado_id", gradoId);

        if (!asignaturas || asignaturas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">No hay asignaturas en este grado.</td></tr>`;
            return;
        }

        const { data: actividades } = await db
            .from("actividades")
            .select(`
                id,
                asignatura_id,
                pea_tema_id,
                pea_temas:pea_tema_id (periodo)
            `)
            .eq("grado_id", gradoId);

        const { data: entregas } = await db
            .from("actividades_entregas")
            .select("actividad_id, nota")
            .eq("estudiante_id", estudianteId);

        const notasMap = {};
        if (entregas) {
            entregas.forEach(e => {
                if (e.nota !== null && e.nota !== undefined) {
                    notasMap[e.actividad_id] = parseFloat(e.nota);
                }
            });
        }

        tbody.innerHTML = "";

        asignaturas.forEach(asig => {
            const actsMateria = actividades ? actividades.filter(a => a.asignatura_id === asig.id) : [];
            const periodosNotas = { 1: [], 2: [], 3: [] };

            actsMateria.forEach(act => {
                if (act.pea_temas && act.pea_temas.periodo) {
                    const p = act.pea_temas.periodo;
                    if (periodosNotas[p] && notasMap[act.id] !== undefined) {
                        periodosNotas[p].push(notasMap[act.id]);
                    }
                }
            });

            const calcularPromedio = (arr) => {
                if (arr.length === 0) return 0.0;
                const suma = arr.reduce((acc, val) => acc + val, 0);
                return suma / arr.length;
            };

            const p1 = calcularPromedio(periodosNotas[1]);
            const p2 = calcularPromedio(periodosNotas[2]);
            const p3 = calcularPromedio(periodosNotas[3]);

            // Fórmula: (P1 * 0.25) + (P2 * 0.35) + (P3 * 0.4)
            const total = (p1 * 0.25) + (p2 * 0.35) + (p3 * 0.4);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${asig.nombre}</strong></td>
                <td>${p1 > 0 ? p1.toFixed(1) : '-'}</td>
                <td>${p2 > 0 ? p2.toFixed(1) : '-'}</td>
                <td>${p3 > 0 ? p3.toFixed(1) : '-'}</td>
                <td><strong>${total > 0 ? total.toFixed(1) : '-'}</strong></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error al calcular boletín:", err.message);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar las calificaciones.</td></tr>`;
    }
}

// ==========================================
// 4. DESCARGA EN PDF
// ==========================================
function configurarBotonPDF() {
    const btnDescargarPDF = document.getElementById("btn_descargar_pdf");
    if (btnDescargarPDF) {
        btnDescargarPDF.addEventListener("click", () => {
            const elemento = document.getElementById("reporte_notas");
            const opciones = {
                margin:       10,
                filename:     'Boletin_Calificaciones.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opciones).from(elemento).save();
        });
    }
}