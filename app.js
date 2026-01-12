// 1. Variables Globales
let clientes = [];
const contenedor = document.getElementById("contenedor_cards");
const info = document.getElementById("info");
const busquedaInput = document.getElementById("busqueda");
const filtroLocalidad = document.getElementById("filtro");
const btnLimpiarFiltros = document.getElementById("limpiarFiltros");

// 2. Utilidades de Almacenamiento (LocalStorage)
function obtenerVisitados() {
    return JSON.parse(localStorage.getItem('visitas_completadas')) || [];
}

// 3. Carga de Datos
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

// 4. Lógica de Visualización
// Define los iconos como variables de texto para no repetir código
const iconoMapa = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6v14l7-4 8 4 7-4V2l-7 4-8-4-7 4z"></path><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`;
const iconoCheck = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
const iconoUndo = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;

function mostrarClientes(lista) {
    contenedor.innerHTML = "";
    const visitados = obtenerVisitados();

    lista.forEach(e => {
        const nombreCompleto = `${e.NOMBRES} ${e.APELLIDO_PATERNO} ${e.APELLIDO_MATERNO}`;
        const yaVisitado = visitados.some(v => v.id === e.CÓDIGO_DE_SUMINISTRO2);
        const claseEstado = e.ESTADO__SFD2 === "0" ? "estado-inoperativo" : "";
        const claseVisitado = yaVisitado ? "visitado" : "";

        contenedor.innerHTML += `
        <div class="card ${claseEstado} ${claseVisitado}">
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
                        ${iconoCheck} Visita
                    </button>`
                }
                <button class="btn-mapa-simple" onclick="abrirSoloMapa('${e.LATITUD2}', '${e.LONGITUD2}')">
                    ${iconoMapa} Mapa
                </button>
            </div>
        </div>
    `;
    });
}

// 5. Filtros
function llenarFiltroLocalidades() {
    const localidades = [...new Set(clientes.map(p => p.LOCALIDAD))];
    filtroLocalidad.innerHTML = '<option value="Todos">Todos los Distritos</option>';
    localidades.forEach(d => {
        filtroLocalidad.innerHTML += `<option value="${d}">${d}</option>`;
    });
}

function aplicarFiltros() {
    const texto = busquedaInput.value.toLowerCase();
    const localidad = filtroLocalidad.value;

    const filtrados = clientes.filter(p => {
        const coincideBusqueda =
            p.NOMBRES.toLowerCase().includes(texto) ||
            p.APELLIDO_PATERNO.toLowerCase().includes(texto) ||
            p.N__DNI.includes(texto) ||
            p.CÓDIGO_DE_SUMINISTRO2.includes(texto);

        const coincideLocalidad = localidad === "Todos" || p.LOCALIDAD === localidad;
        return coincideBusqueda && coincideLocalidad;
    });

    btnLimpiarFiltros.disabled = (texto === "" && localidad === "Todos");
    info.textContent = `Se encontraron ${filtrados.length} registros`;
    mostrarClientes(filtrados);
}

function limpiarFiltros() {
    busquedaInput.value = "";
    filtroLocalidad.value = "Todos";
    info.textContent = "";
    btnLimpiarFiltros.disabled = true;

    // Al limpiar, mostramos de nuevo el array global 'clientes' (la lista original)
    mostrarClientes(clientes);
}

// 6. Gestión de Visitas (LocalStorage)
function registrarVisitaYAbrir(id, nombre, lat, lng) {
    let historial = obtenerVisitados();

    if (!historial.some(item => item.id === id)) {
        historial.push({ id, nombre, lat, lng, fecha: new Date().toLocaleString() });
        localStorage.setItem('visitas_completadas', JSON.stringify(historial));
    }

    aplicarFiltros(); // Refresca para mostrar el check verde
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
}

function restablecerVisitas() {
    if (confirm("¿Borrar todas las visitas del día?")) {
        localStorage.removeItem('visitas_completadas');
        aplicarFiltros();
    }
}

function verVisitas() {
    const historial = obtenerVisitados();
    if (historial.length === 0) return alert("No hay visitas registradas.");

    info.textContent = `Mostrando ${historial.length} visitas completadas`;

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

    mostrarClientes(datosAdaptados);
}



// 7 Función solo para marcar visita
let clienteTemporal = null;
let accionTemporal = ""; // "AGREGAR" o "QUITAR"

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
    btnConfirmar.className = claseBoton; // Cambia el color (verde o rojo)
    btnConfirmar.textContent = textoBoton;

    banner.classList.remove("banner-oculto");
}

// Evento del botón confirmar del Banner (ÚNICO)
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

        // IMPORTANTE: Al terminar, volvemos a aplicar filtros para actualizar la vista
        aplicarFiltros();
    }
    cerrarBanner();
});

document.getElementById("btn-cancelar").addEventListener("click", cerrarBanner);

function cerrarBanner() {
    document.getElementById("banner-confirmacion").classList.add("banner-oculto");
    clienteTemporal = null;
}

// 8 Función solo para abrir el mapa
function abrirSoloMapa(lat, lng) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
}

// 9 Función para enviar reporte por WhatsApp
function enviarReporteWhatsApp() {
    const historial = obtenerVisitados();

    if (historial.length === 0) {
        alert("No hay visitas registradas para reportar.");
        return;
    }

    let mensaje = `*REPORTE DE VISITAS* %0A`;
    mensaje += `*Fecha:* ${new Date().toLocaleDateString()}%0A`;
    mensaje += `--------------------------%0A`;

    historial.forEach((v, index) => {
        // %0A es un salto de línea en WhatsApp
        mensaje += `*${index + 1}.* Suministro: ${v.id}%0A`;
        mensaje += `   Beneficiario: ${v.nombre}%0A%0A`;
    });

    const url = `https://wa.me/?text=${mensaje}`;
    window.open(url, '_blank');
}

// 10 Función para quitar una visita
function quitarVisita(id) {
    if (confirm("¿Deseas quitar este cliente de la lista de visitas realizadas?")) {
        let historial = obtenerVisitados();

        // Filtramos el historial para dejar fuera al ID seleccionado
        const nuevoHistorial = historial.filter(item => item.id !== id);

        localStorage.setItem('visitas_completadas', JSON.stringify(nuevoHistorial));

        // Refrescamos la vista
        aplicarFiltros();
    }
}

// 11. Eventos y Exportación
cargarDatos();

// 12 funcion para detectar el scroll
let lastScrollTop = 0;
const header = document.getElementById("main-header");
const h1 = document.querySelector("h1");
const threshold = 10; // Margen para evitar el rebote

window.addEventListener("scroll", function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Si el movimiento es muy pequeño, no hacer nada
    if (Math.abs(lastScrollTop - scrollTop) <= threshold) return;

    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Bajando - Ocultar
        header.classList.add("header-hidden");
        if (h1) h1.style.opacity = "0"; // Usamos opacidad para que no salte el layout
    } else {
        // Subiendo - Mostrar
        header.classList.remove("header-hidden");
        if (h1) h1.style.opacity = "1";
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // Evitar valores negativos
}, { passive: true });


busquedaInput.addEventListener("input", aplicarFiltros);
filtroLocalidad.addEventListener("change", aplicarFiltros);
btnLimpiarFiltros.addEventListener("click", limpiarFiltros);
document.getElementById("btnReset").addEventListener("click", restablecerVisitas);
document.getElementById("btnOffline").addEventListener("click", verVisitas);

// IMPORTANTE: Publicar las funciones para el onclick del HTML
window.registrarVisitaYAbrir = registrarVisitaYAbrir;
window.soloRegistrarVisita = soloRegistrarVisita;
window.abrirSoloMapa = abrirSoloMapa;
window.enviarReporteWhatsApp = enviarReporteWhatsApp;
window.quitarVisita = quitarVisita;
window.soloRegistrarVisita = soloRegistrarVisita;
window.abrirSoloMapa = abrirSoloMapa;
window.confirmarQuitarVisita = confirmarQuitarVisita;