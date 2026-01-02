import { productos} from "./data.js";

//const productos = productos;
const tabla = document.getElementById("tabla_productos");
const busquedaInput = document.getElementById("busqueda");
const filtroCategoria = document.getElementById("filtro");
const ordenPrecio = document.getElementById("ordenPrecio");
const info = document.getElementById("info");
const btnLimpiarFiltros = document.getElementById("limpiarFiltros");

const hayFiltrosActivos = () => {
    return busquedaInput.value.trim() !== "" ||
           filtroCategoria.value !== "Todos" ||
           ordenPrecio.value !== "";
}

function mostrarProductos(lista) {
    tabla.innerHTML = "";
    
    lista.forEach(e => {
        const claseStock = e.stock <=20 ? "stock-bajo":"";
        tabla_productos.innerHTML += `
       <tr class ="${claseStock}">
            <td>${e.nombre}</td>
            <td>${e.categoria}</td>
            <td>${e.precio}</td>
            <td>${e.stock}</td>
        </tr>
    `
    });
}
// unica funcion para para filtra por categoria y nombre
function aplicarFiltros(){
    const texto = busquedaInput.value.toLowerCase();
    const categoria  = filtroCategoria.value;
    const orden = ordenPrecio.value;
    const filtrados = productos.filter(p =>{
        const coincideNombre = p.nombre.toLowerCase().includes(texto);
        const coincideCategoria = categoria === "Todos" || p.categoria === categoria;
        return coincideNombre && coincideCategoria;
    });

    if(orden === "asc"){
        filtrados.sort((a,b)=> a.precio - b.precio);
    }else if(orden ==="desc"){
        filtrados.sort((a,b)=>b.precio - a.precio);
    }

    btnLimpiarFiltros.disabled = !hayFiltrosActivos();
    info.textContent = 
    filtrados.length===1
    ?"se encontró 1 producto"
    :`se encontraron ${filtrados.length} productos`;
    mostrarProductos(filtrados);
}

function limpiarFiltros(){
    busquedaInput.value = "";
    filtroCategoria.value = "Todos";
    ordenPrecio.value = "";
    info.textContent = "";
    btnLimpiarFiltros.disabled = true;
    mostrarProductos(productos);
}

//asignar evento al boton limpiar filtros
btnLimpiarFiltros.addEventListener("click", limpiarFiltros);

//asignar eventos 
busquedaInput.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);
ordenPrecio.addEventListener("change", aplicarFiltros);

//mostrat todos los productos al inicio
mostrarProductos(productos);