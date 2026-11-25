// Avisa al CSS que JavaScript está activo
document.documentElement.classList.add('js');

// Menú hamburguesa
const botonMenu = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu-principal');

botonMenu.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    botonMenu.setAttribute('aria-expanded', abierto);
});

// ---------- Validación del formulario de contacto ----------
const formContacto = document.getElementById('form-contacto');

if (formContacto) {
    // Una regla por campo: devuelve '' si está bien, o el mensaje de error
    const reglas = {
        nombre: V => V.trim().length < 3 ? 'Escribe tu nombre completo (mínimo 3 letras).' : '',
        correo: V => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(V.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@correo.com.',
        telefono: V => /^\d{10}$/.test(V.trim()) ? '' : 'El teléfono debe tener exactamente 10 dígitos, solo números.',
        asunto: V => V === '' ? 'Selecciona un asunto.' : '',
        mensaje: V => V.trim().length < 10 ? 'El mensaje debe tener al menor 10 caracteres.' : '',
        acepto: (V, campo) => campo.checked ? '' : 'Debes aceptar el uso de tus datos.'
    }

    // Muestra u oculta el mensaje de error debajo del campo
    function mostrarError(campo, mensaje) {
        let aviso = campo.parentElement.querySelector('.error');
        if (!aviso) {
            aviso = document.createElement('small');
            aviso.className = 'error';
            aviso.setAttribute('role', 'alert');
            campo.parentElement.appendChild(aviso);
        }
        aviso.textContent = mensaje;
        campo.classList.toggle('invalido', mensaje !== '');
        campo.setAttribute('aria-invalid', mensaje !== '');
    }

    // Valida un campo y devuelve true si está correcto
    function validarCampo(campo) {
        const regla = reglas[campo.name];
        if (!regla) return true;
        const mensaje = regla(campo.value, campo);
        mostrarError(campo, mensaje);
        return mensaje === '';
    }

    // Revalida cada campo mientras el usuario lo corrige
    formContacto.querySelectorAll('input, select, textarea').forEach(campo => {
        campo.addEventListener('input', () => validarCampo(campo));
        campo.addEventListener('change', () => validarCampo(campo));
    })

    // Al enviar: se detiene el envío y se validan todos los campo
    formContacto.addEventListener('submit', evento => {
        evento.preventDefault(); // Sin preventDefault() el formulario se enviaría antes de validarlo
        const campos = [...formContacto.querySelectorAll('input, select, textarea')];
        const invalidos = campos.filter(campo => !validarCampo(campo));

        if (invalidos.length > 0) {
            invalidos[0].focus(); // lleva al primer error
            return;
        }
        // Todo correcto (por ahora solo mostramos un mensaje de éxito)
        let exito = formContacto.querySelector('.exito');
        if (!exito) {
            exito = document.createElement('p');
            exito.className = 'exito';
            exito.setAttribute('role', 'status');
            formContacto.appendChild(exito);
        }
        exito.textContent = '¡Mensaje enviado! Gracias por escribirnos.';
        formContacto.reset();
    });
}

// ---------- Catálogo: mostrar, buscar y filtrar ----------
const listaCatalogo = document.getElementById('catalogo');

if (listaCatalogo && typeof JUEGOS !== 'undefined') {
    const campoBuscar = document.getElementById('buscar');
    const selectGenero = document.getElementById('filtro-genero');
    const formBuscador = document.querySelector('.buscador');
    const contador = document.getElementById('contador');
    const sinResultados = document.getElementById('sin-resultados');

    // Quita mayúsculas y acentos
    // Ejemplo de uso: al buscar "baldurs" encuentra "Baldur's" (nombre real del juego)
    const normalizar = texto => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Convertir un juego (objeto) en el HTML de su tarjeta
    function crearTarjeta(j) {
        return `
        <li>
        <article class="juego">
          <figure><img src="img/${j.id}.jpg" alt="Ilustración de portada de ${j.titulo}" width="600" height="340" loading="lazy"></figure>
          <div class="cuerpo">
            <h3>${j.titulo}</h3>
            <p class="nota" aria-label="Nota GameVault ${j.nota} de 10">★ ${j.nota}</p>
            <p>${j.descripcion}</p>
            <dl>
              <dt>Género</dt><dd>${j.genero}</dd>
              <dt>Estudio</dt><dd>${j.estudio}</dd>
              <dt>Año</dt><dd>${j.anio}</dd>
              <dt>Plataformas</dt><dd>${j.plataformas}</dd>
            </dl>
            <footer class="acciones">
              <a class="boton" href="${j.tienda}" target="_blank" rel="noopener noreferrer">Ver en tienda oficial</a>
              <button class="boton boton-sec" type="button" data-guardar="${j.id}">${estaGuardado(j.id) ? '★ Guardado' : '☆ Guardar en biblioteca'}</button>
            </footer>
          </div>
        </article>
      </li>`;
    }

    // Llena el select con los géneros que existan en los datos (sin repetir)
    [...new Set(JUEGOS.map(j => j.genero))].sort().forEach(genero => {
        selectGenero.add(new Option(genero, genero));
    });

    // Aplica búsqueda + filtro y vuelve a dibujar el catálogo
    function actualizarCatalogo() {
        const texto = normalizar(campoBuscar.value.trim());
        const genero = selectGenero.value;

        const resultado = JUEGOS.filter(j => {
            const coincideTexto = normalizar(`${j.titulo} ${j.genero} ${j.estudio}`).includes(texto);
            const coincideGenero = genero === '' || j.genero === genero;
            return coincideTexto && coincideGenero;
        });

        listaCatalogo.innerHTML = resultado.map(crearTarjeta).join('');
        sinResultados.hidden = resultado.length > 0;
        contador.textContent = `Mostrando ${resultado.length} de ${JUEGOS.length} juegos.`
    }

    campoBuscar.addEventListener('input', actualizarCatalogo);
    selectGenero.addEventListener('change', actualizarCatalogo);
    formBuscador.addEventListener('submit', e => { e.preventDefault(); actualizarCatalogo();});

    actualizarCatalogo(); // dibujo inicial
}

// ---------- Sesión simulada (invitado / usuario / administrador) ----------
const ADMIN = {
    usuario: 'admin',
    correo: 'admin@gamevault.com',
    contrasena: 'Admin1234',
    rol: 'admin'
};

function leerJSON(clave, porDefecto) {
    try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto; }
    catch { return porDefecto; }
}
const leerUsuarios = () => leerJSON('gv_usuarios', []);
const sesionActual = () => leerJSON('gv_sesion', null);
const rolActual = () => sesionActual()?.rol ?? 'invitado';

function iniciarSesion(u) {
    localStorage.setItem('gv_sesion', JSON.stringify({ usuario: u.usuario, correo: u.correo, rol: u.rol}));
}
function cerrarSesion() {
    localStorage.removeItem('gv_sesion')
}

// Muestra un mensaje de error arriba de un formulario
function mostrarMensaje(form, texto) {
    let aviso = form.querySelector('.error_general');
    if (!aviso) {
        aviso.document.createElement('p');
        aviso.className = 'error error_general';
        aviso.setAttribute('role', 'alert');
        form.prepend(aviso);
    }
    aviso.textContent = texto;
}

// Registro / Crear nueva cuenta
const formRegistro = document.getElementById('form_registro')
if (formRegistro) {
    formRegistro.addEventListener('submit', e => {
        e.preventDefault();
        const datos = new FormData(formRegistro);
        const usuario = datos.get('usuario').trim();
        const correo = datos.get('correo').trim().toLowerCase();
        const pass = datos.get('contrasena');

        if (pass !== datos.get('contrasena2')) return mostrarMensaje(formRegistro, 'Lascontraseñas no coinciden.');
        if (correo === ADMIN.correo || leerUsuarios().some(u => u.correo === correo)) {
            return mostrarMensaje(formRegistro, 'Ese correo ya está registrado.');
        }
        const nuevo = { usuario, correo, contrasena: pass, rol: 'usuario' };
        localStorage.setItem('gv_usuarios', JSON.stringify([...leerUsuarios(), nuevo]));
        window.location.href = 'index.html'
    });
}

// Inicio de sesión
const formLogin = document.getElementById('form_login');
if (formLogin) {
    formLogin.addEventListener('submit', e => {
        e.preventDefault();
        const datos = new FormData(formLogin);
        const correo = datos.get('correo').trim().toLowerCase();
        const pass = datos.get('contrasena')
        const encontrado = [ADMIN, ...leerUsuarios()].find(u => u.correo === correo && u.contrasena === pass);

        if (!encontrado) return mostrarMensaje(formLogin, 'Correo o contraseña incorrectos.');
        iniciarSesion(encontrado);
        window.location.href = encontrado.rol === 'admin' ? 'admin.html' : 'index.html';
    });
}

// Entrar como invitado = no tener sesión
document.getElementById('entrar_invitado')?.addEventListener('click', cerrarSesion);

// El enlace "Iniciar sesión" del menú cambia a "Salir" si hay sesión
const enlaceEntrar = document.querySelector('.menu a.entrar');
const sesion = sesionActual();
if (enlaceEntrar && sesion) {
    enlaceEntrar.textContent = `Salir (${sesion.usuario})`;
    enlaceEntrar.href = '#';
    enlaceEntrar.removeAttribute('aria-current');
    enlaceEntrar.addEventListener('click', e => {
        e.preventDefault();
        cerrarSesion();
        window.location.href = 'index.html';
    });
}

// Bloqueo según el rol
const rol = rolActual();
document.querySelectorAll('[data-requiere]').forEach(zona => {
    const necesario = zona.dataset.requiere;
    const permitido = necesario === 'admin' ? rol === 'admin' : rol !== 'invitado';
    if (permitido) return;

    if (zona.tagName === 'FORM') {
        zona.querySelectorAll('input, select, textarea, button').forEach(campo => { campo.disabled = true; });
        zona.classList.add('bloqueado');
    } else {
        const mensaje = necesario === 'admin'
            ? 'Esta sección es solo para administradores.'
            : 'Necesitas una cuenta para ver esta sección.';
        zona.innerHTML = `<section class="restringido"><h1>Acceso restringido</h1><p>${mensaje}</p><a class="boton" href="login.html">Iniciar sesión</a></section>`;
    }
});

// Si ya hay sesión, los avisos de "solo para usuarios con cuenta" sobran
if (rol !== 'invitado') {
    document.querySelectorAll('.aviso-acceso').forEach(aviso => { aviso.hidden = true; });
}

// ---------- Biblioteca personal ----------
function claveBiblioteca() {
    const s = leerJSON('gv_sesion', null);
    return s ? 'gv_biblioteca' + s.correo : null;
}
function leerBiblioteca() {
    const clave = claveBiblioteca();
    return clave ? leerJSON(clave, []) : [];
}
function guardarBiblioteca(lista) {
    const clave = claveBiblioteca();
    if (clave) localStorage.setItem(clave, JSON.stringify(lista));
}
function estaGuardado(id) {
    return leerBiblioteca().some(g => g.id === id);
}

const ESTADOS = {
    quiero: 'Quiero jugar',
    jugando: 'Jugando',
    completado: 'Completado'
};

// Convierte un juego guardado en la tarjeta de la biblioteca
function tarjetaBiblioteca(j, estado) {
    const opciones = Object.entries(ESTADOS)
        .map(([valor, texto]) => `<option value="${valor}"${valor === estado ? 'selected' : ''}>${texto}</option>`)
        .join('');
    return `
    <li>
      <article class="juego">
        <figure><img src="img/${j.id}.jpg" alt="Ilustración de portada de ${j.titulo}" width="600" height="340" loading="lazy"></figure>
        <div class="cuerpo">
          <h3>${j.titulo}</h3>
          <p>${j.genero}</p>
          <form class="estado" action="#" method="post">
            <label for="estado-${j.id}">Estado</label>
            <select id="estado-${j.id}" name="estado" data-estado="${j.id}">${opciones}</select>
          </form>
          <footer class="acciones">
            <a class="boton boton-sec" href="productos.html">Ver en catálogo</a>
            <button class="boton boton-peligro" type="button" data-quitar="${j.id}">Quitar de mi biblioteca</button>
          </footer>
        </div>
      </article>
    </li>`;
}

// Botón "Guardar" del catálogo (se escucha en la lista completa: delegación de eventos)
if (listaCatalogo) {
    listaCatalogo.addEventListener('click', e => {
        const boton = e.target.closest('[data-guardar]');
        if (!boton) return;
        if (!sesionActual()) {
            document.getElementById('contador').textContent = 'Inicia sesión para guardar juegos en tu biblioteca.'
            return;
        }
        const id = boton.dataset.guardar;
        let lista = leerBiblioteca();
        if (lista.some(g => g.id === id)) {
            lista = lista.filter(g => g.id !== id);
            boton.textContent = '☆ Guardar en biblioteca';
        } else {
            lista.push({ id, estado: 'quiero' });
            boton.textContent = '★ Guardado';
        }
        guardarBiblioteca(lista);
    });
}

// Página de la biblioteca
const listaBibioteca = document.getElementById('lista-biblioteca');
if (listaBibioteca && typeof JUEGOS !== 'undefined') {
    const mensajeVacio = document.getElementById('biblioteca-vacia');

    function dibujarBiblioteca() {
        const guardados = leerBiblioteca();
        listaBibioteca.innerHTML = guardados
            .map(g => { const j = JUEGOS.find(x => x.id === g.id); return j  ? tarjetaBiblioteca(j, g.estado) : ''; })
            .join('');
        mensajeVacio.hidden = guardados.length > 0;
    }

    // Cambiar el estado de un juego
    listaBibioteca.addEventListener('change', e => {
        const select = e.target.closest('[data-estado]');
        if (!select) return;
        guardarBiblioteca(leerBiblioteca().map(g => g.id === select.dataset.estado ? {...g, estado: select.value } : g));
    });

    // Quitar un juego
    listaBibioteca.addEventListener('click', e => {
        const boton = e.target.closest('[data-quitar]');
        if (!boton) return;
        guardarBiblioteca(leerBiblioteca().filter(g => g.id !== boton.dataset.quitar));
        dibujarBiblioteca();
    });

    dibujarBiblioteca();
}

// ---------- Reseñas ----------
const RESENAS_EJEMPLO = [
  { id: 'ej1', juego: 'Hades', nota: 9, titulo: 'Cada intento es distinto', texto: 'Cada intento se siente distinto y la historia avanza aunque pierdas. Muy recomendable.', usuario: 'jugador_ejemplo1', fecha: '2026-11-12T12:00:00' },
  { id: 'ej2', juego: 'Celeste', nota: 10, titulo: 'Difícil pero justo', texto: 'Difícil pero justo. Las opciones de accesibilidad permiten disfrutarlo a tu ritmo.', usuario: 'jugador_ejemplo2', fecha: '2026-11-09T12:00:00' },
  { id: 'ej3', juego: 'Stardew Valley', nota: 9, titulo: 'Perfecto para relajarse', texto: 'Perfecto para relajarse después de clases. Siempre hay algo por hacer en la granja.', usuario: 'jugador_ejemplo3', fecha: '2026-11-05T12:00:00' }
];

// La primera vez se guardan las de ejemplo; después se leen las que haya
function leerResenas() {
  if (localStorage.getItem('gv_resenas') === null) {
    localStorage.setItem('gv_resenas', JSON.stringify(RESENAS_EJEMPLO));
  }
  return leerJSON('gv_resenas', []);
}
function guardarResenas(lista) {
  localStorage.setItem('gv_resenas', JSON.stringify(lista));
}

// Convierte símbolos peligrosos en texto inofensivo (prevención de XSS)
function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fechaLarga(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function tarjetaResena(r) {
  return `
    <article class="tarjeta">
      <h3>${escaparHTML(r.juego)}</h3>
      <p class="nota" aria-label="Nota ${r.nota} de 10">★ ${r.nota}</p>
      <p><strong>${escaparHTML(r.titulo)}</strong></p>
      <p>${escaparHTML(r.texto)}</p>
      <footer><small>Por <strong>${escaparHTML(r.usuario)}</strong> · <time datetime="${r.fecha.slice(0, 10)}">${fechaLarga(r.fecha)}</time></small></footer>
    </article>`;
}

const listaResenas = document.getElementById('lista-resenas');
if (listaResenas) {
  const mensajeVacio = document.getElementById('resenas-vacia');

  function dibujarResenas() {
    const resenas = leerResenas();
    listaResenas.innerHTML = resenas.map(tarjetaResena).join('');
    if (mensajeVacio) mensajeVacio.hidden = resenas.length > 0;
  }

  const formResena = document.getElementById('form-resena');
  if (formResena) {
    formResena.addEventListener('submit', e => {
      e.preventDefault();
      if (!sesionActual()) return; // un invitado no puede publicar

      const datos = new FormData(formResena);
      const juego = datos.get('juego');
      const nota = Number(datos.get('nota'));
      const titulo = datos.get('titulo').trim();
      const texto = datos.get('texto').trim();

      let error = '';
      if (!juego) error = 'Selecciona el juego que vas a reseñar.';
      else if (!Number.isInteger(nota) || nota < 1 || nota > 10) error = 'La nota debe ser un número entero del 1 al 10.';
      else if (titulo.length < 5) error = 'El título debe tener al menos 5 caracteres.';
      else if (texto.length < 30) error = 'Tu opinión debe tener al menos 30 caracteres.';

      if (error) return mostrarMensaje(formResena, error);

      const nueva = { id: String(Date.now()), juego, nota, titulo, texto, usuario: sesionActual().usuario, fecha: new Date().toISOString() };
      guardarResenas([nueva, ...leerResenas()]); // la más reciente va primero
      formResena.querySelector('.error-general')?.remove();
      formResena.reset();
      dibujarResenas();

      let exito = formResena.querySelector('.exito');
      if (!exito) {
        exito = document.createElement('p');
        exito.className = 'exito';
        exito.setAttribute('role', 'status');
        formResena.appendChild(exito);
      }
      exito.textContent = '¡Reseña publicada! Ya aparece en la lista.';
    });
  }

  dibujarResenas();
}

// ---------- Noticias ----------
const CATEGORIAS = { industria: 'Industria', guias: 'Guías', comunidad: 'Comunidad', resenas: 'Reseñas' };
const NOTICIAS_EJEMPLO = [
  { id: 'n1', categoria: 'Guías', titulo: 'Cómo elegir tu próximo juego según tu género', texto: 'Una guía rápida para filtrar por género y plataforma sin perderte entre cientos de títulos.', fecha: '2026-11-18T12:00:00' },
  { id: 'n2', categoria: 'Comunidad', titulo: 'Biblioteca personal: organiza tu pendiente', texto: 'Guarda los juegos que quieres jugar y consúltalos después desde tu perfil.', fecha: '2026-11-15T12:00:00' },
  { id: 'n3', categoria: 'Reseñas', titulo: 'Reseñas de la comunidad: cómo escribir una útil', texto: 'Consejos para compartir opiniones honestas que ayuden a otros jugadores a decidir.', fecha: '2026-11-10T12:00:00' },
  { id: 'n4', categoria: 'Industria', titulo: 'Qué mirar antes de comprar un juego en una tienda digital', texto: 'Revisa requisitos, plataformas compatibles y vendedores oficiales para evitar sorpresas.', fecha: '2026-11-07T12:00:00' },
  { id: 'n5', categoria: 'Guías', titulo: 'Juegos para empezar si no has jugado RPG', texto: 'Cinco ideas de entrada, desde aventuras tranquilas hasta historias largas.', fecha: '2026-11-03T12:00:00' },
  { id: 'n6', categoria: 'Comunidad', titulo: 'Reglas de convivencia en las reseñas de GameVault', texto: 'Respeto, sin spoilers sin avisar y sin contenido ofensivo. Así cuidamos la comunidad.', fecha: '2026-10-28T12:00:00' }
];

function leerNoticias() {
  if (localStorage.getItem('gv_noticias') === null) {
    localStorage.setItem('gv_noticias', JSON.stringify(NOTICIAS_EJEMPLO));
  }
  return leerJSON('gv_noticias', []);
}
function guardarNoticias(lista) {
  localStorage.setItem('gv_noticias', JSON.stringify(lista));
}

function tarjetaNoticia(n, nivel = 'h2') {
  return `
    <article class="tarjeta">
      <p class="etiqueta">${escaparHTML(n.categoria)}</p>
      <${nivel} class="h3">${escaparHTML(n.titulo)}</${nivel}>
      <time datetime="${n.fecha.slice(0, 10)}">${fechaLarga(n.fecha)}</time>
      <p class="texto-largo">${escaparHTML(n.texto)}</p>
    </article>`;
}

// Página de noticias: todas
const listaNoticias = document.getElementById('lista-noticias');
if (listaNoticias) {
  listaNoticias.innerHTML = leerNoticias().map(n => tarjetaNoticia(n)).join('');
}

// Inicio: las 3 más recientes
const noticiasRecientes = document.getElementById('noticias-recientes');
if (noticiasRecientes) {
  noticiasRecientes.innerHTML = leerNoticias().slice(0, 3).map(n => tarjetaNoticia(n, 'h3')).join('');
}

// ---------- Panel de administrador ----------
function tarjetaAdminResena(r) {
  return `
    <li>
      <article class="tarjeta">
        <h3>${escaparHTML(r.juego)} <span class="nota">★ ${r.nota}</span></h3>
        <p><strong>${escaparHTML(r.titulo)}</strong></p>
        <p>${escaparHTML(r.texto)}</p>
        <p><small>Por <strong>${escaparHTML(r.usuario)}</strong> · <time datetime="${r.fecha.slice(0, 10)}">${fechaLarga(r.fecha)}</time></small></p>
        <button class="boton boton-peligro" type="button" data-eliminar="${escaparHTML(r.id)}">Eliminar reseña</button>
      </article>
    </li>`;
}

const listaAdminResenas = document.getElementById('lista-admin-resenas');
if (listaAdminResenas) {
  const adminVacio = document.getElementById('admin-vacio');

  function dibujarAdminResenas() {
    const resenas = leerResenas();
    listaAdminResenas.innerHTML = resenas.map(tarjetaAdminResena).join('');
    if (adminVacio) adminVacio.hidden = resenas.length > 0;
  }

  listaAdminResenas.addEventListener('click', e => {
    const boton = e.target.closest('[data-eliminar]');
    if (!boton || rolActual() !== 'admin') return;
    if (!confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return;
    guardarResenas(leerResenas().filter(r => r.id !== boton.dataset.eliminar));
    dibujarAdminResenas();
  });

  dibujarAdminResenas();
}

// Publicar noticia
const formNoticia = document.getElementById('form-noticia');
if (formNoticia) {
  formNoticia.addEventListener('submit', e => {
    e.preventDefault();
    if (rolActual() !== 'admin') return;

    const datos = new FormData(formNoticia);
    const categoria = CATEGORIAS[datos.get('categoria')];
    const titulo = datos.get('titulo').trim();
    const texto = datos.get('contenido').trim();

    let error = '';
    if (!categoria) error = 'Selecciona una categoría.';
    else if (titulo.length < 5) error = 'El título debe tener al menos 5 caracteres.';
    else if (texto.length < 30) error = 'El contenido debe tener al menos 30 caracteres.';
    if (error) return mostrarMensaje(formNoticia, error);

    guardarNoticias([{ id: String(Date.now()), categoria, titulo, texto, fecha: new Date().toISOString() }, ...leerNoticias()]);
    formNoticia.querySelector('.error-general')?.remove();
    formNoticia.reset();

    let exito = formNoticia.querySelector('.exito');
    if (!exito) {
      exito = document.createElement('p');
      exito.className = 'exito';
      exito.setAttribute('role', 'status');
      formNoticia.appendChild(exito);
    }
    exito.innerHTML = '¡Noticia publicada! <a href="noticias.html">Ver en Noticias</a>';
  });
}