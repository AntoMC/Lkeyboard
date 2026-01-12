// 1. Declarar la variable global para los datos
let clientes = []; 

const tabla = document.getElementById("tabla_productos");
// ... (tus otros selectores se mantienen igual)
const info = document.getElementById("info");
const busquedaInput = document.getElementById("busqueda");
const filtroLocalidad = document.getElementById("filtro");
const ordenPrecio = document.getElementById("ordenPrecio");
const btnLimpiarFiltros = document.getElementById("limpiarFiltros");

const hayFiltrosActivos = () => {
    return busquedaInput.value.trim() !== "" ||
           filtroLocalidad.value !== "Todos" ||
           ordenPrecio.value !== "";
}
// 2. Función para cargar los datos (Asíncrona)
async function cargarDatos() {
    try {
        const respuesta = await fetch('./usuarios_huasmin.json'); // Ruta a tu archivo
        if (!respuesta.ok) throw new Error("Error al cargar el JSON");
        
        clientes = await respuesta.json(); // Guardamos los datos en la variable global
        llenarFiltroLocalidades();
        mostrarProductos(clientes); // Mostramos los productos por primera vez
    } catch (error) {
        console.error("Hubo un error:", error);
        info.textContent = "Error al cargar los productos.";
    }
}

// 3. Modificar la función mostrarProductos
function mostrarProductos(lista) {
    tabla.innerHTML = "";
    
    lista.forEach(e => {
        // Concatenamos el nombre completo para mostrarlo mejor
        const nombreCompleto = `${e.NOMBRES} ${e.APELLIDO_PATERNO} ${e.APELLIDO_MATERNO}`;
        
        // Ejemplo de condición: Si el ESTADO__SFD2 es "0", lo marcamos en rojo
        const claseEstado = e.ESTADO__SFD2 === "0" ? "estado-inoperativo" : "";

        tabla.innerHTML += `
        <tr class="${claseEstado}">
            <td>${e.CÓDIGO_DE_SUMINISTRO2}</td>
            <td>${nombreCompleto}</td>
            <td>${e.DISTRITO}</td>
            <td>${e.LOCALIDAD}</td>
            <td>${e.N__DNI}</td>
        </tr>
    `;
    });
}

// ... (tus funciones aplicarFiltros y limpiarFiltros se quedan IGUAL)
function aplicarFiltros() {
    
    const texto = busquedaInput.value.toLowerCase();
    const localidadSeleccionada = filtroLocalidad.value; // Usamos el select para distritos
    const orden = ordenPrecio.value;

    const filtrados = clientes.filter(p => {
        // Buscamos en múltiples campos: Nombre, DNI o Suministro
        const coincideBusqueda = 
            p.NOMBRES.toLowerCase().includes(texto) || 
            p.APELLIDO_PATERNO.toLowerCase().includes(texto) ||
            p.N__DNI.includes(texto) ||
            p.CÓDIGO_DE_SUMINISTRO2.includes(texto);

        const coincideLocalidad = localidadSeleccionada === "Todos" || p.LOCALIDAD === localidadSeleccionada;

        return coincideBusqueda && coincideLocalidad;
    });

    // Ordenar por Número (N_)
    if (orden === "asc") {
        filtrados.sort((a, b) => parseInt(a.N_) - parseInt(b.N_));
    } else if (orden === "desc") {
        filtrados.sort((a, b) => parseInt(b.N_) - parseInt(a.N_));
    }

    // Actualizar interfaz
    btnLimpiarFiltros.disabled = !hayFiltrosActivos();
    info.textContent = `Se encontraron ${filtrados.length} registros`;
    mostrarProductos(filtrados);
}


// 4 llenar el select 
function llenarFiltroLocalidades() {
    // Extraemos distritos únicos
    const localidades = [...new Set(clientes.map(p => p.LOCALIDAD))];
    
    filtroLocalidad.innerHTML = '<option value="Todos">Todos los Distritos</option>';
    localidades.forEach(d => {
        filtroLocalidad.innerHTML += `<option value="${d}">${d}</option>`;
    });
}

function limpiarFiltros(){
    busquedaInput.value = "";
    filtroLocalidad.value = "Todos";
    ordenPrecio.value = "";
    info.textContent = "";
    btnLimpiarFiltros.disabled = true;
    mostrarProductos(clientes);
}

// 5. Iniciar el proceso
cargarDatos();

// Eventos
btnLimpiarFiltros.addEventListener("click", limpiarFiltros);
busquedaInput.addEventListener("input", aplicarFiltros);
filtroLocalidad.addEventListener("change", aplicarFiltros);
ordenPrecio.addEventListener("change", aplicarFiltros);
