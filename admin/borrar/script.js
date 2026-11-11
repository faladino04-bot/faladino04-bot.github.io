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


//crear curso/asignatura/anuncio
document.getElementById("crear").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_crear").classList.remove("oculto");
  document.getElementById("mcrear").style.backgroundColor = "#037EF5"
});
document.getElementById("crear").addEventListener("click", ()=>{
  window.location.href = "../crear/crear.html";
});
document.getElementById("crear").addEventListener("mouseleave", ()=>{
  document.getElementById("texto_crear").classList.add("oculto");
  document.getElementById("mcrear").style.backgroundColor = "transparent"
});


document.getElementById("agregar_usuario").addEventListener("mouseenter", ()=>{
  document.getElementById("texto_agregar").classList.remove("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "#037EF5"
});
document.getElementById("agregar_usuario").addEventListener("click", ()=>{
  window.location.href = "../añadir/añadir.html";
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
  window.location.href = "borrar.html";
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


// Mostrar o ocultar el campo "Grado" según el rol seleccionado
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

// Logica para borrar usuario de la BD
const btnBorrar = document.getElementById("btn-accion");

if (btnBorrar) {
    btnBorrar.addEventListener("click", async () => {
        const usuarioInput = document.getElementById("usuario").value.trim();
        const rolSelect = document.getElementById("rol").value;

        if (!usuarioInput || !rolSelect) {
            alert("Por favor, ingresa el nombre de usuario y selecciona el rol.");
            return;
        }

        const rolNormalizado = rolSelect.toLowerCase();

        try {
            btnBorrar.disabled = true;
            btnBorrar.textContent = "Buscando...";

            const usuarios = await listarUsuarios();
            
            const usuarioEncontrado = usuarios.find(u => 
                u.usuario.toLowerCase() === usuarioInput.toLowerCase() && 
                u.rol.toLowerCase() === rolNormalizado
            );

            if (!usuarioEncontrado) {
                throw new Error("No se encontró ningún usuario con ese nombre y rol en el sistema.");
            }

            if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${usuarioEncontrado.nombre}" (${usuarioEncontrado.usuario})?`)) {
                btnBorrar.disabled = false;
                btnBorrar.textContent = "Borrar";
                return;
            }

            btnBorrar.textContent = "Eliminando...";

            await eliminarUsuario(usuarioEncontrado.id);

            alert("¡Usuario eliminado exitosamente de la base de datos!");
            
            document.getElementById("form-borrar").reset();
            if (document.getElementById("contenedor_grado")) {
                document.getElementById("contenedor_grado").style.display = "none";
            }

        } catch (error) {
            alert("Error al borrar: " + error.message);
        } finally {
            btnBorrar.disabled = false;
            btnBorrar.textContent = "Borrar";
        }
    });
}
