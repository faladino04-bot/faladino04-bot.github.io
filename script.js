// Configuracion de Supabase (El que toque algo lo exorciso), estos comentarios serán borrados cuando se lance el proyecto
// Estos dos valores estan en: Supabase > Project Settings > API
// La "anon key" es pública por diseño, la seguridad la dan las políticas RLS y la fe
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";

const { createClient } = supabase; // viene del <script> CDN de index.html
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// elementos del HTML
const inputUser = document.getElementById("user");
const inputPassword = document.getElementById("password");
const selectRol = document.getElementById("rol");
const btnEnviar = document.getElementById("enviar");

// Supabase Auth exige correo, pero el formulario pide "usuario", asi solucionamos la falta de correo y usuario.
// Convertimos el usuario en un correo de uso interno: juan -> juan@schoolaret.app
const usuarioAEmail = (usuario) =>
  `${usuario.trim().toLowerCase()}@schoolaret.app`;

// Login 22
async function iniciarSesion() {
  const usuario = inputUser.value.trim();
  const password = inputPassword.value;
  const rolElegido = selectRol.value;

  if (!usuario || !password) {
    alert("Ingrese usuario y contraseña.");
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Ingresando...";

  try {
    // 1. Autenticar
    const { data, error } = await db.auth.signInWithPassword({
      email: usuarioAEmail(usuario),
      password,
    });
    if (error) throw new Error("Usuario o contraseña incorrectos.");

    // 2. Buscar el rol real en la tabla "perfiles"
    const { data: perfil, error: errPerfil } = await db
      .from("perfiles")
      .select("nombre, rol")
      .eq("id", data.user.id)
      .single();
    if (errPerfil || !perfil) throw new Error("No se encontró el perfil.");

    // 3. El rol elegido en el select debe coincidir con el real para pasar
    if (perfil.rol !== rolElegido) {
      await db.auth.signOut();
      throw new Error(`Esta cuenta no tiene el rol "${rolElegido}".`);
    }

    // 4. Redirigir según el rol (ajusten las rutas a sus páginas)
    const destinos = {
      estudiante: "estudiantes/index.html",
      profesor: "profesores/index.html",
      administrador: "administrador/index.html",
    };
    window.location.href = destinos[perfil.rol];
  } catch (err) {
    alert(err.message);
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Enviar";
  }
}

btnEnviar.addEventListener("click", iniciarSesion);

// Enter en los campos también envía
[inputUser, inputPassword].forEach((el) =>
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") iniciarSesion();
  })
);

//Proteger páginas internas
// En cada página interna (estudiantes, etc.) pueden usar:
// const { data: { session } } = await db.auth.getSession();
// if (!session) window.location.href = "../index.html";
// No lo arruinen
