/* --- 1. VARIABLES GLOBALES Y ELEMENTOS DEL DOM --- */
let clientes = [];
let clienteTemporal = null;
let accionTemporal = ""; // "AGREGAR" o "QUITAR"
let lastScrollTop = 0;

const contenedor = document.getElementById("contenedor_cards");
const info = document.getElementById("info");
const busquedaInput = document.getElementById("busqueda");
const filtroLocalidad = document.getElementById("filtro");
const btnLimpiarFiltros = document.getElementById("limpiarFiltros");
const header = document.getElementById("main-header");
const titulo_app = document.getElementById("titulo_app");
const menuLateral = document.getElementById("menu-lateral");
const btnMenu = document.getElementById("btn-menu");
const btnCerrarMenu = document.getElementById("btn-cerrar-menu");
const botonesMenu = document.querySelectorAll('.btn-menu-item');
const backToTopBtn = document.getElementById("backToTop");

// Iconos SVG
const iconoMapa = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6v14l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`;
const iconoCheck = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
const iconoUndo = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;

/* --- 2. FUNCIONES DE CARGA Y DATOS --- */
async function cargarDatos() {
    try {
        const respuesta = await fetch('./usuarios_huasmin.json');
        if (!respuesta.ok) throw new Error("Error al cargar el JSON");

        clientes = await respuesta.json();
        llenarFiltroLocalidades();
        mostrarClientes(clientes);
    } catch (error) {
        console.error("Error:", error);
        info.textContent = "Error al cargar los datos.";
    }
}

function obtenerVisitados() {
    return JSON.parse(localStorage.getItem('visitas_completadas')) || [];
}

/* --- 3. FUNCIONES DE INTERFAZ Y VISUALIZACIÓN --- */
function mostrarClientes(lista) {
    contenedor.innerHTML = "";
    const visitados = obtenerVisitados();

    lista.forEach((e, index) => {
        const nombreCompleto = `${e.NOMBRES} ${e.APELLIDO_PATERNO} ${e.APELLIDO_MATERNO}`;
        const yaVisitado = visitados.some(v => v.id === e.CÓDIGO_DE_SUMINISTRO2);

        const card = document.createElement('div');
        card.className = `card ${e.ESTADO__SFD2 === "0" ? 'estado-inoperativo' : ''} ${yaVisitado ? 'visitado' : ''}`;

        const delay = Math.min(index * 0.05, 0.5);
        card.style.animationDelay = `${delay}s`;
        card.style.opacity = "0";
        card.style.animationFillMode = "forwards";

        card.innerHTML = `
            ${yaVisitado ? `<span class="check-visitado">${iconoCheck} VISITADO</span>` : ''}
            <p class="label">Suministro: ${e.CÓDIGO_DE_SUMINISTRO2}</p>
            <h3>${nombreCompleto}</h3>
            <p><strong>DNI:</strong> ${e.N__DNI}</p>
            <p><strong>Localidad:</strong> ${e.LOCALIDAD}</p>
            <div class="card-acciones">
                ${yaVisitado ?
                `<button class="btn-quitar" onclick="confirmarQuitarVisita('${e.CÓDIGO_DE_SUMINISTRO2}', '${nombreCompleto}')">
                        ${iconoUndo} Quitar
                    </button>` :
                `<button class="btn-check" onclick="soloRegistrarVisita('${e.CÓDIGO_DE_SUMINISTRO2}', '${nombreCompleto}')">
                        ${iconoCheck} Marcar Visita
                    </button>`
            }
                <button class="btn-mapa-simple" onclick="abrirSoloMapa('${e.LATITUD2}', '${e.LONGITUD2}')">
                    ${iconoMapa} Ver Mapa
                </button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function llenarFiltroLocalidades() {
    const localidades = [...new Set(clientes.map(p => p.LOCALIDAD))];
    filtroLocalidad.innerHTML = '<option value="Todos">Localidad</option>';
    localidades.forEach(d => {
        filtroLocalidad.innerHTML += `<option value="${d}">${d}</option>`;
    });
}

function actualizarTabs(idActivo) {
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === idActivo) {
            tab.classList.add('active');
        }
    });
}

/* --- 4. FUNCIONES DE LÓGICA Y FILTROS --- */
function aplicarFiltros() {
    // 1. Limpiamos el texto: quitamos espacios extras al inicio/final y pasamos a minúsculas
    const textoBusqueda = busquedaInput.value.toLowerCase().trim();
    const filtroLocalidadVal = filtroLocalidad.value;

    // 2. Dividimos la búsqueda en palabras (por ejemplo: "Juan Perez" -> ["juan", "perez"])
    const palabrasBusqueda = textoBusqueda.split(/\s+/);

    const filtrados = clientes.filter(p => {
        // Creamos una sola cadena con toda la información del cliente
        const nombreCompleto = `${p.NOMBRES} ${p.APELLIDO_PATERNO} ${p.APELLIDO_MATERNO}`.toLowerCase();
        const dni = p.N__DNI.toString();
        const suministro = p.CÓDIGO_DE_SUMINISTRO2.toString();

        // Verificamos si CADA palabra escrita en el buscador está en algún lado del cliente
        // Esto permite buscar "Perez Juan" o "Juan 4587" y que funcione.
        const coincideBusqueda = palabrasBusqueda.every(palabra =>
            nombreCompleto.includes(palabra) ||
            dni.includes(palabra) ||
            suministro.includes(palabra)
        );

        const coincideLocalidad = filtroLocalidadVal === "Todos" || p.LOCALIDAD === filtroLocalidadVal;

        return coincideBusqueda && coincideLocalidad;
    });

    // Actualizamos la interfaz
    btnLimpiarFiltros.disabled = (textoBusqueda === "" && filtroLocalidadVal === "Todos");
    titulo_app.innerText = "";
    info.textContent = `Se encontraron ${filtrados.length} registros`;
    actualizarTabs(null);
    mostrarClientes(filtrados);
}

function limpiarFiltros() {
    busquedaInput.value = "";
    filtroLocalidad.value = "Todos";
    info.textContent = "";
    btnLimpiarFiltros.disabled = true;
    actualizarTabs('tab-inicio');
    titulo_app.innerText = "Huasmin";
    mostrarClientes(clientes);
}

/* --- 5. GESTIÓN DE VISITAS Y REPORTES --- */
function verVisitas() {
    const historial = obtenerVisitados();
    if (historial.length === 0) return alert("No hay visitas registradas.");

    info.textContent = `${historial.length} visitas completadas`;

    const datosAdaptados = historial.map(v => ({
        CÓDIGO_DE_SUMINISTRO2: v.id,
        NOMBRES: v.nombre,
        APELLIDO_PATERNO: "",
        APELLIDO_MATERNO: "",
        LATITUD2: v.lat,
        LONGITUD2: v.lng,
        LOCALIDAD: "VISITADO",
        ESTADO__SFD2: "1"
    }));
    actualizarTabs('tab-visitas');
    mostrarClientes(datosAdaptados);
    btnLimpiarFiltros.disabled = false;
}

function restablecerVisitas() {
    if (confirm("¿Borrar todas las visitas del día?")) {
        localStorage.removeItem('visitas_completadas');
        limpiarFiltros();
    }
}

function enviarReporteWhatsApp() {
    const historial = obtenerVisitados();
    if (historial.length === 0) return alert("No hay visitas registradas para reportar.");

    let mensaje = `🚀 *REPORTE DE CAMPO - HUASMÍN*%0A`;
    mensaje += `📅 *Fecha:* ${new Date().toLocaleDateString()}%0A`;
    mensaje += `----------------------------%0A`;

    historial.forEach((v, index) => {
        mensaje += `*${index + 1}.* Suministro: ${v.id}%0A`;
        mensaje += `   Beneficiario: ${v.nombre}%0A%0A`;
    });

    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
}

/* --- 6. GESTIÓN DEL MODAL/BANNER --- */
function soloRegistrarVisita(id, nombre) {
    clienteTemporal = { id, nombre };
    accionTemporal = "AGREGAR";
    abrirBanner(`¿Marcar visita para:<br><strong>${nombre}</strong>?`, "btn-primario", "Confirmar Visita");
}

function confirmarQuitarVisita(id, nombre) {
    clienteTemporal = { id, nombre };
    accionTemporal = "QUITAR";
    abrirBanner(`¿Deseas quitar la visita de:<br><strong>${nombre}</strong>?`, "btn-rojo", "Quitar Registro");
}

function abrirBanner(mensaje, claseBoton, textoBoton) {
    const banner = document.getElementById("banner-confirmacion");
    const btnConfirmar = document.getElementById("btn-confirmar");
    document.getElementById("banner-mensaje").innerHTML = mensaje;
    btnConfirmar.className = claseBoton;
    btnConfirmar.textContent = textoBoton;
    banner.classList.remove("banner-oculto");
}

function cerrarBanner() {
    document.getElementById("banner-confirmacion").classList.add("banner-oculto");
    clienteTemporal = null;
}

/* --- 7. UTILIDADES --- */
function abrirSoloMapa(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
}

/* --- 8. EVENTOS (LISTENERS) --- */
busquedaInput.addEventListener("input", aplicarFiltros);
filtroLocalidad.addEventListener("change", aplicarFiltros);
btnLimpiarFiltros.addEventListener("click", limpiarFiltros);

// Eventos Tab Bar
document.getElementById("tab-inicio").addEventListener("click", limpiarFiltros);
document.getElementById("tab-visitas").addEventListener("click", verVisitas);
//document.getElementById("tab-reporte").addEventListener("click", enviarReporteWhatsApp);

// Eventos Menú/Modal
if (btnMenu) btnMenu.addEventListener("click", () => menuLateral.style.display = "block");
if (btnCerrarMenu) btnCerrarMenu.addEventListener("click", () => menuLateral.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === menuLateral) menuLateral.style.display = "none"; });

botonesMenu.forEach(boton => {
    boton.addEventListener('click', () => {
        setTimeout(() => { if (menuLateral) menuLateral.style.display = "none"; }, 150);
    });
});

document.getElementById("btn-confirmar").addEventListener("click", () => {
    if (clienteTemporal) {
        let historial = obtenerVisitados();
        if (accionTemporal === "AGREGAR") {
            if (!historial.some(item => item.id === clienteTemporal.id)) {
                historial.push({ ...clienteTemporal, fecha: new Date().toLocaleString() });
            }
        } else if (accionTemporal === "QUITAR") {
            historial = historial.filter(item => item.id !== clienteTemporal.id);
        }
        localStorage.setItem('visitas_completadas', JSON.stringify(historial));
        aplicarFiltros();
    }
    cerrarBanner();
});

document.getElementById("btn-cancelar").addEventListener("click", cerrarBanner);
document.getElementById("btnReset").addEventListener("click", restablecerVisitas);
//document.getElementById("btnOffline").addEventListener("click", verVisitas);

// Scroll Inteligente
window.addEventListener("scroll", function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // Lógica para mostrar/ocultar el botón "Ir arriba"
    if (scrollTop > 300) {
        backToTopBtn.classList.add("show");
    } else {
        backToTopBtn.classList.remove("show");
    }

    if (Math.abs(lastScrollTop - scrollTop) <= 10) return;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        header.classList.add("header-hidden");
        if (h1) h1.style.opacity = "0";
    } else {
        header.classList.remove("header-hidden");
        if (h1) h1.style.opacity = "1";
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, { passive: true });

// Función para hacer el scroll hacia arriba
backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth" // Desplazamiento suave
    });
});
// Inicialización
window.addEventListener('load', () => {
    actualizarTabs('tab-inicio');
    cargarDatos();
});

/* --- 9. EXPORTACIÓN PARA ONCLICK --- */
window.soloRegistrarVisita = soloRegistrarVisita;
window.confirmarQuitarVisita = confirmarQuitarVisita;
window.abrirSoloMapa = abrirSoloMapa;
window.enviarReporteWhatsApp = enviarReporteWhatsApp;
window.limpiarFiltros = limpiarFiltros;