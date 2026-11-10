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
            contenedorGrado.style.display = "flex"; // Muestra el campo
        } else {
            contenedorGrado.style.display = "none";  // Oculta el campo
            document.getElementById("grado").value = ""; // Limpia el valor si cambia de opinión
        }
    });
}

// Protección de sesion con Supabase
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "administrador";

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
})();
// --- LÓGICA PARA REGISTRAR USUARIO EN LA BD ---
const btnAccion = document.getElementById("btn-accion");

if (btnAccion) {
    btnAccion.addEventListener("click", async () => {
        // Capturar los valores de los inputs
        const usuarioInput = document.getElementById("usuario").value.trim();
        const nombreInput = document.getElementById("nombre").value.trim();
        const passwordInput = document.getElementById("contrasena").value.trim();
        const rolSelect = document.getElementById("rol").value;
        const gradoInput = document.getElementById("grado").value.trim();

        // Validaciones básicas de campos vacíos
        if (!usuarioInput || !nombreInput || !passwordInput || !rolSelect) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }

        // Normalizar el rol a minúsculas como lo espera la API (estudiante, profesor, administrador)[cite: 14]
        const rolNormalizado = rolSelect.toLowerCase();

        // Validar si es estudiante para requerir grado
        if (rolNormalizado === "estudiante" && !gradoInput) {
            alert("El grado es obligatorio para los estudiantes.");
            return;
        }

        try {
            // Mostrar estado de carga opcional o deshabilitar botón
            btnAccion.disabled = true;
            btnAccion.textContent = "Guardando...";

            // Llamar a la función de la API de usuarios[cite: 14]
            await crearUsuario({
                usuario: usuarioInput,
                password: passwordInput,
                nombre: nombreInput,
                rol: rolNormalizado,
                grado: rolNormalizado === "estudiante" ? gradoInput : null
            });

            alert("¡Usuario registrado exitosamente en la base de datos!");
            
            // Limpiar el formulario después del éxito
            document.getElementById("form-añadir").reset();
            if (document.getElementById("contenedor_grado")) {
                document.getElementById("contenedor_grado").style.display = "none";
            }

        } catch (error) {
            // Muestra el mensaje de error que devuelva Supabase (ej. "Ese usuario ya existe")[cite: 14]
            alert("Error al registrar: " + error.message);
        } finally {
            btnAccion.disabled = false;
            btnAccion.textContent = "Añadir";
        }
    });
}