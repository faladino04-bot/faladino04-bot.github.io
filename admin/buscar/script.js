// ==========================================
// 1. MENÚ LATERAL Y NAVEGACIÓN
// ==========================================
document.getElementById("logo").addEventListener("click", () => {
  const menu = document.getElementById("menu_lado");
  menu.classList.toggle("oculto");
});

document.getElementById("home").addEventListener("mouseenter", () => {
  document.getElementById("texto_home").classList.remove("oculto");
  document.getElementById("mhome").style.backgroundColor = "#037EF5";
});
document.getElementById("home").addEventListener("click", () => {
  window.location.href = "../admin.html";
});
document.getElementById("home").addEventListener("mouseleave", () => {
  document.getElementById("texto_home").classList.add("oculto");
  document.getElementById("mhome").style.backgroundColor = "transparent";
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


document.getElementById("agregar_usuario").addEventListener("mouseenter", () => {
  document.getElementById("texto_agregar").classList.remove("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "#037EF5";
});
document.getElementById("agregar_usuario").addEventListener("click", () => {
  window.location.href = "../añadir/añadir.html";
});
document.getElementById("agregar_usuario").addEventListener("mouseleave", () => {
  document.getElementById("texto_agregar").classList.add("oculto");
  document.getElementById("magregar_usuario").style.backgroundColor = "transparent";
});

document.getElementById("borrar_usuario").addEventListener("mouseenter", () => {
  document.getElementById("texto_borrar").classList.remove("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "#037EF5";
});
document.getElementById("borrar_usuario").addEventListener("click", () => {
  window.location.href = "../borrar/borrar.html";
});
document.getElementById("borrar_usuario").addEventListener("mouseleave", () => {
  document.getElementById("texto_borrar").classList.add("oculto");
  document.getElementById("mborrar_usuario").style.backgroundColor = "transparent";
});

document.getElementById("buscar_usuario").addEventListener("mouseenter", () => {
  document.getElementById("texto_buscar").classList.remove("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "#037EF5";
});
document.getElementById("buscar_usuario").addEventListener("click", () => {
  window.location.href = "buscar.html";
});
document.getElementById("buscar_usuario").addEventListener("mouseleave", () => {
  document.getElementById("texto_buscar").classList.add("oculto");
  document.getElementById("mbuscar_usuario").style.backgroundColor = "transparent";
});

document.getElementById("cerrar").addEventListener("mouseenter", () => {
  document.getElementById("texto_cerrar").classList.remove("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "#037EF5";
});

document.getElementById("cerrar").addEventListener("mouseleave", () => {
  document.getElementById("texto_cerrar").classList.add("oculto");
  document.getElementById("mcerrar").style.backgroundColor = "transparent";
});

document.getElementById("cerrar").addEventListener("click", () => {
  db.auth.signOut();
  window.location.href = "../../index.html";
  return;
});


// ==========================================
// 2. PROTECCIÓN DE SESIÓN Y CARGA DE GRADOS
// ==========================================
const SUPABASE_URL = "https://olfmganjfrgeaxszwvfr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2OD_Dw7QNM-GJ9j02vwQzA_XeqyNfXM";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROL_REQUERIDO = "administrador";

async function cargarSelectsGrados() {
  const selectBuscar = document.getElementById("buscar_grado");
  const selectMod = document.getElementById("mod_grado");

  const { data: grados, error } = await db.from("grados").select("nombre").order("nombre");

  if (error) {
    console.error("Error al cargar grados:", error.message);
    return;
  }

  if (selectBuscar) {
    selectBuscar.innerHTML = "<option value=''>Todos los grados</option>";
    grados.forEach(g => {
      selectBuscar.innerHTML += `<option value="${g.nombre}">${g.nombre}</option>`;
    });
  }

  if (selectMod) {
    selectMod.innerHTML = "<option value=''>Seleccione un grado</option>";
    grados.forEach(g => {
      selectMod.innerHTML += `<option value="${g.nombre}">${g.nombre}</option>`;
    });
  }
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
  await cargarSelectsGrados();
})();


// ==========================================
// 3. LÓGICA DE BÚSQUEDA Y MODIFICACIÓN
// ==========================================
let usuarioSeleccionadoGlobal = null;

// Visibilidad de Grado en el formulario de BÚSQUEDA
const buscarRol = document.getElementById("buscar_rol");
const contenedorGradoBuscar = document.getElementById("contenedor_grado_buscar");

if (buscarRol && contenedorGradoBuscar) {
  buscarRol.addEventListener("change", (e) => {
    if (e.target.value === "Estudiante") {
      contenedorGradoBuscar.style.display = "flex";
    } else {
      contenedorGradoBuscar.style.display = "none";
      const campoGrado = document.getElementById("buscar_grado");
      if (campoGrado) campoGrado.value = "";
    }
  });
}

// Visibilidad de Grado en el formulario de MODIFICACIÓN
const modRol = document.getElementById("mod_rol");
const modContenedorGrado = document.getElementById("mod_contenedor_grado");

if (modRol && modContenedorGrado) {
  modRol.addEventListener("change", (e) => {
    if (e.target.value === "estudiante") {
      modContenedorGrado.style.display = "flex";
    } else {
      modContenedorGrado.style.display = "none";
      const modGrado = document.getElementById("mod_grado");
      if (modGrado) modGrado.value = "";
    }
  });
}

// Ejecutar búsqueda en Supabase
const btnEjecutarBusqueda = document.getElementById("btn-ejecutar-busqueda");
if (btnEjecutarBusqueda) {
  btnEjecutarBusqueda.addEventListener("click", async () => {
    const textoFiltro = document.getElementById("buscar_nombre").value.toLowerCase().trim();
    const rolFiltro = document.getElementById("buscar_rol").value.toLowerCase();
    const gradoFiltro = document.getElementById("buscar_grado").value;
    const listaUsuariosEl = document.getElementById("lista_usuarios");
    
    listaUsuariosEl.innerHTML = "<li>Buscando...</li>";

    try {
      const usuarios = await listarUsuarios();
      
      const filtrados = usuarios.filter(u => {
        const coincideTexto = !textoFiltro || u.nombre.toLowerCase().includes(textoFiltro) || u.usuario.toLowerCase().includes(textoFiltro);
        const coincideRol = !rolFiltro || u.rol.toLowerCase() === rolFiltro;
        const coincideGrado = !gradoFiltro || u.grado === gradoFiltro;
        return coincideTexto && coincideRol && coincideGrado;
      });

      listaUsuariosEl.innerHTML = "";

      if (filtrados.length === 0) {
        listaUsuariosEl.innerHTML = "<p style='color:#777; font-size:0.9rem;'>No se encontraron usuarios.</p>";
        return;
      }

      filtrados.forEach(u => {
        const li = document.createElement("li");
        li.style.cssText = "padding: 8px; border-bottom: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between;";
        
        li.innerHTML = `
          <label style="cursor: pointer; display: flex; align-items: center; gap: 10px; width: 100%;">
            <input type="radio" name="usuario_seleccionado" class="radio-usuario" data-id="${u.id}" data-usuario="${u.usuario}" data-nombre="${u.nombre}" data-rol="${u.rol}" data-grado="${u.grado || ''}">
            <span><strong>${u.nombre}</strong> (${u.usuario}) - <span style="text-transform:capitalize;">${u.rol}</span> ${u.grado ? '- ' + u.grado : ''}</span>
          </label>
        `;
        listaUsuariosEl.appendChild(li);
      });

      document.querySelectorAll(".radio-usuario").forEach(radio => {
        radio.addEventListener("change", (e) => {
          usuarioSeleccionadoGlobal = {
            id: e.target.getAttribute("data-id"),
            usuario: e.target.getAttribute("data-usuario"),
            nombre: e.target.getAttribute("data-nombre"),
            rol: e.target.getAttribute("data-rol"),
            grado: e.target.getAttribute("data-grado")
          };

          document.getElementById("seccion_acciones_usuario").style.display = "flex";
          document.getElementById("caja_mensaje").style.display = "none";
          document.getElementById("caja_modificar").style.display = "none";
        });
      });

    } catch (err) {
      listaUsuariosEl.innerHTML = `<p style='color:red;'>Error al buscar: ${err.message}</p>`;
    }
  });
}

// Botones para desplegar cajas de Mensaje o Modificación
const btnMostrarCaja = document.getElementById("btn_mostrar_caja_mensaje");
const cajaMensaje = document.getElementById("caja_mensaje");
const btnMostrarModificar = document.getElementById("btn_mostrar_modificar");
const cajaModificar = document.getElementById("caja_modificar");

if (btnMostrarCaja && cajaMensaje) {
  btnMostrarCaja.addEventListener("click", () => {
    cajaMensaje.style.display = cajaMensaje.style.display === "none" ? "flex" : "none";
    if (cajaModificar) cajaModificar.style.display = "none";
  });
}

if (btnMostrarModificar && cajaModificar) {
  btnMostrarModificar.addEventListener("click", () => {
    if (cajaModificar.style.display === "none" || cajaModificar.style.display === "") {
      cajaModificar.style.display = "flex";
      if (cajaMensaje) cajaMensaje.style.display = "none";

      if (usuarioSeleccionadoGlobal) {
        document.getElementById("mod_usuario").value = usuarioSeleccionadoGlobal.usuario;
        document.getElementById("mod_nombre").value = usuarioSeleccionadoGlobal.nombre;
        document.getElementById("mod_rol").value = usuarioSeleccionadoGlobal.rol;
        
        // Controlar si se muestra el contenedor de grado según el rol del usuario seleccionado
        if (usuarioSeleccionadoGlobal.rol === "estudiante") {
          modContenedorGrado.style.display = "flex";
          document.getElementById("mod_grado").value = usuarioSeleccionadoGlobal.grado || "";
        } else {
          modContenedorGrado.style.display = "none";
          document.getElementById("mod_grado").value = "";
        }
      }
    } else {
      cajaModificar.style.display = "none";
    }
  });
}

// Guardar cambios de modificación en la BD a través de la Edge Function
const btnGuardarCambios = document.getElementById("btn_guardar_cambios");
if (btnGuardarCambios) {
  btnGuardarCambios.addEventListener("click", async () => {
    if (!usuarioSeleccionadoGlobal) return;

    const nuevoNombre = document.getElementById("mod_nombre").value.trim();
    const nuevoRol = document.getElementById("mod_rol").value.toLowerCase();
    const nuevoGrado = document.getElementById("mod_grado").value;
    const nuevaPassword = document.getElementById("mod_password").value.trim();

    if (!nuevoNombre || !nuevoRol) {
      alert("El nombre y el rol son obligatorios.");
      return;
    }

    if (nuevoRol === "estudiante" && !nuevoGrado) {
      alert("El grado es obligatorio para estudiantes.");
      return;
    }

    try {
      btnGuardarCambios.disabled = true;
      btnGuardarCambios.textContent = "Guardando...";

      // 1. Actualizar datos (nombre, rol, grado) mediante la Edge Function
      await actualizarUsuario({
        id: usuarioSeleccionadoGlobal.id,
        nombre: nuevoNombre,
        rol: nuevoRol,
        grado: nuevoRol === 'estudiante' ? nuevoGrado : null
      });

      // 2. Si ingresó una contraseña nueva, actualizarla también
      if (nuevaPassword) {
        await cambiarPassword(usuarioSeleccionadoGlobal.id, nuevaPassword);
      }

      alert("¡Datos y rol actualizados correctamente en la BD!");
      
      // Ocultar caja y limpiar
      cajaModificar.style.display = "none";
      document.getElementById("mod_password").value = "";
      
      // Refrescar la búsqueda automáticamente
      if (btnEjecutarBusqueda) btnEjecutarBusqueda.click();

    } catch (err) {
      alert("Error al actualizar: " + err.message);
    } finally {
      btnGuardarCambios.disabled = false;
      btnGuardarCambios.textContent = "Guardar Cambios";
    }
  });
}
// ==========================================
// 4. GESTIÓN DE HORARIO DEL PROFESOR
// ==========================================
const selectHora = document.getElementById("horario_hora");
if (selectHora) {
  selectHora.innerHTML = "";
  for (let h = 6; h <= 22; h++) {
    const horaFormato = h < 10 ? `0${h}:00` : `${h}:00`;
    const horaAmPm = h === 12 ? '12:00 p.m.' : h > 12 ? `${h - 12}:00 p.m.` : `${h}:00 a.m.`;
    const opt = document.createElement("option");
    opt.value = horaFormato;
    opt.textContent = horaAmPm;
    selectHora.appendChild(opt);
  }
}

const btnMostrarHorario = document.getElementById("btn_mostrar_horario");
const cajaHorario = document.getElementById("caja_horario");

if (btnMostrarHorario && cajaHorario) {
  btnMostrarHorario.addEventListener("click", async () => {
    if (cajaHorario.style.display === "none" || cajaHorario.style.display === "") {
      cajaHorario.style.display = "flex";
      if (cajaMensaje) cajaMensaje.style.display = "none";
      if (cajaModificar) cajaModificar.style.display = "none";
      await cargarHorarioProfesorAdmin();
    } else {
      cajaHorario.style.display = "none";
    }
  });
}

// Cuando se selecciona un usuario en la búsqueda, verificar si es profesor
document.addEventListener("change", (e) => {
  if (e.target && e.target.classList.contains("radio-usuario")) {
    const rol = e.target.getAttribute("data-rol").toLowerCase();
    if (btnMostrarHorario) {
      if (rol === "profesor") {
        btnMostrarHorario.style.display = "block";
      } else {
        btnMostrarHorario.style.display = "none";
        if (cajaHorario) cajaHorario.style.display = "none";
      }
    }
  }
});

async function cargarHorarioProfesorAdmin() {
  if (!usuarioSeleccionadoGlobal) return;
  const tbody = document.getElementById("tabla_horario_admin_cuerpo");
  tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Cargando horario...</td></tr>";

  try {
    const { data: bloques, error } = await db
      .from("horarios")
      .select("*")
      .eq("profesor_id", usuarioSeleccionadoGlobal.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    tbody.innerHTML = "";
    if (!bloques || bloques.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#777;'>No hay clases asignadas.</td></tr>";
      return;
    }

    bloques.forEach(b => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 6px; border: 1px solid #ddd;">${b.dia}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${b.hora}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${b.materia} (${b.grado})</td>
        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">
          <button type="button" onclick="eliminarBloqueHorario('${b.id}')" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar horario:", err.message);
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:red;'>Error al cargar.</td></tr>";
  }
}

const btnGuardarBloque = document.getElementById("btn_guardar_bloque_horario");
if (btnGuardarBloque) {
  btnGuardarBloque.addEventListener("click", async () => {
    if (!usuarioSeleccionadoGlobal) return;

    const dia = document.getElementById("horario_dia").value;
    const hora = document.getElementById("horario_hora").value;
    const materia = document.getElementById("horario_materia").value.trim();
    const grado = document.getElementById("horario_grado").value.trim();

    if (!materia || !grado) {
      alert("Por favor completa la materia y el grado.");
      return;
    }

    try {
      const { error } = await db.from("horarios").insert([{
        profesor_id: usuarioSeleccionadoGlobal.id,
        dia: dia,
        hora: hora,
        materia: materia,
        grado: grado
      }]);

      if (error) throw error;

      alert("¡Clase añadida al horario correctamente!");
      document.getElementById("horario_materia").value = "";
      document.getElementById("horario_grado").value = "";
      await cargarHorarioProfesorAdmin();
    } catch (err) {
      alert("Error al guardar bloque: " + err.message);
    }
  });
}

window.eliminarBloqueHorario = async function(idBloque) {
  if (!confirm("¿Estás seguro de eliminar este bloque de horario?")) return;
  try {
    const { error } = await db.from("horarios").delete().eq("id", idBloque);
    if (error) throw error;
    await cargarHorarioProfesorAdmin();
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
};