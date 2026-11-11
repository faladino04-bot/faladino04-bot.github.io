// Menú lateral
document.getElementById("logo").addEventListener("click", () => {
  const menu = document.getElementById("menu_lado");
  menu.classList.toggle("oculto");
});

document.getElementById("home").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_home").classList.remove("oculto");
  document.getElementById("mhome").style.backgroundColor = "#037EF5"
});
document.getElementById("home").addEventListener("click", ()=>{
  window.location.href = "../admin.html";
});
document.getElementById("home").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_home").classList.add("oculto");
  document.getElementById("mhome").style.backgroundColor = "transparent"
});

document.getElementById("agregar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_agregar").classList.remove("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("agregar_usuario").addEventListener("click", ()=>{
  window.location.href = "añadir.html";
});
document.getElementById("agregar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_agregar").classList.add("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "transparent"
});

document.getElementById("borrar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_borrar").classList.remove("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("borrar_usuario").addEventListener("click", ()=>{
  window.location.href = "../borrar/borrar.html";
});
document.getElementById("borrar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_borrar").classList.add("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "transparent"
});

document.getElementById("buscar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_buscar").classList.remove("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("buscar_usuario").addEventListener("click", ()=>{
  window.location.href = "../buscar/buscar.html";
});
document.getElementById("buscar_usuario").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_buscar").classList.add("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "transparent"
});

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

// Mostrar u ocultar el campo "Grado" según el rol seleccionado
const selectRol = document.getElementById("rol");
const contenedorGrado = document.getElementById("contenedor_grado");

if (selectRol && contenedorGrado) {
    selectRol.addEventListener("change", (e) => {
        if (e.target.value === "Estudiante") {
            contenedorGrado.style.display = "flex"; 
        } else {
            contenedorGrado.style.display = "none";  
            document.getElementById("grado").value = ""; 
        }
    });
}

// Protección de sesion con Supabase y carga de grados
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "administrador";

async function cargarGradosEnSelect() {
  const selectGrado = document.getElementById("grado");
  if (!selectGrado) return;

  const { data: grados, error } = await db.from("grados").select("nombre").order("nombre");

  if (error) {
    console.error("Error al cargar grados:", error.message);
    selectGrado.innerHTML = "<option value=''>Error al cargar grados</option>";
    return;
  }

  selectGrado.innerHTML = "<option value=''>Seleccione un grado</option>";
  grados.forEach(g => {
    selectGrado.innerHTML += `<option value="${g.nombre}">${g.nombre}</option>`;
  });
}

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
  
  // Cargar los grados dinámicamente al iniciar sesión con éxito
  await cargarGradosEnSelect();
})();

// --- LÓGICA PARA REGISTRAR USUARIO EN LA BD ---
const btnAccion = document.getElementById("btn-accion");

if (btnAccion) {
    btnAccion.addEventListener("click", async () => {
        const usuarioInput = document.getElementById("usuario").value.trim();
        const nombreInput = document.getElementById("nombre").value.trim();
        const passwordInput = document.getElementById("contrasena").value.trim();
        const rolSelect = document.getElementById("rol").value;
        const gradoSelect = document.getElementById("grado").value; // Ahora captura del select

        if (!usuarioInput || !nombreInput || !passwordInput || !rolSelect) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }

        const rolNormalizado = rolSelect.toLowerCase();

        if (rolNormalizado === "estudiante" && !gradoSelect) {
            alert("El grado es obligatorio para los estudiantes.");
            return;
        }

        try {
            btnAccion.disabled = true;
            btnAccion.textContent = "Guardando...";

            await crearUsuario({
                usuario: usuarioInput,
                password: passwordInput,
                nombre: nombreInput,
                rol: rolNormalizado,
                grado: rolNormalizado === "estudiante" ? gradoSelect : null
            });

            alert("¡Usuario registrado exitosamente en la base de datos!");
            
            document.getElementById("form-añadir").reset();
            if (document.getElementById("contenedor_grado")) {
                document.getElementById("contenedor_grado").style.display = "none";
            }

        } catch (error) {
            alert("Error al registrar: " + error.message);
        } finally {
            btnAccion.disabled = false;
            btnAccion.textContent = "Añadir";
        }
    });
}