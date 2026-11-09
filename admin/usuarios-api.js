// admin/usuarios-api.js
// Funciones para gestionar usuarios desde las pantallas del administrado
// Requiere que la página ya haya cargado el CDN de Supabase y su script.js
// (el que crea la constante "db"), en este orden:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="script.js"></script>
//   <script src="../usuarios-api.js"></script>   <- desde admin/añadir, borrar, buscar
//
// Toda la seguridad la hace la Edge Function, si quien llama no es administrador,
// el servidor rechaza la petición aunque alguien manipule este archivo

const FUNCION_USUARIOS = "quick-worker"; // nombre de la Edge Function en Supabase

async function llamarFuncionUsuarios(cuerpo) {
  const { data, error } = await db.functions.invoke(FUNCION_USUARIOS, {
    body: cuerpo,
  });

  if (error) {
    // Intenta mostrar el mensaje que mandó el servidor ("Ese usuario ya existe", etc, cosas así)
    let mensaje = error.message;
    try {
      const detalle = await error.context.json();
      if (detalle?.error) mensaje = detalle.error;
    } catch (_) {}
    throw new Error(mensaje);
  }
  return data;
}

// Devuelve [{ id, usuario, nombre, rol, grado, created_at }, ...]
// MUCHO OJO, "rol" viene en minúscula ("estudiante", "profesor", "administrador")
async function listarUsuarios() {
  const data = await llamarFuncionUsuarios({ accion: "listar" });
  return data.usuarios;
}

// usuario: solo letras minúsculas, números, punto o guion bajo (3-30 caracteres)
// rol: "estudiante" | "profesor" | "administrador"
// grado: obligatorio si el rol es "estudiante" (ej. "10°"); se ignora en los demás roles
async function crearUsuario({ usuario, password, nombre, rol, grado }) {
  return llamarFuncionUsuarios({ accion: "crear", usuario, password, nombre, rol, grado });
}

async function eliminarUsuario(id) {
  return llamarFuncionUsuarios({ accion: "eliminar", id });
}

async function cambiarPassword(id, password) {
  return llamarFuncionUsuarios({ accion: "cambiar_password", id, password });
}

/* Ejemplitos de uso

// Crear (pantalla añadir):
try {
  await crearUsuario({ usuario: "maria.lopez", password: "clave123", nombre: "María López", rol: "estudiante" });
  alert("Usuario creado");
} catch (e) {
  alert(e.message);
}

// Listar (pantalla buscar / borrar):
const usuarios = await listarUsuarios();
usuarios.forEach(u => console.log(u.usuario, u.nombre, u.rol));

// Eliminar (pantalla borrar):
if (confirm("¿Eliminar a " + u.nombre + "?")) {
  await eliminarUsuario(u.id);
}
*/
