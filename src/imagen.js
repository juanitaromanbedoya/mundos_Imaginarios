// fs: leer/escribir archivos y crear carpetas
const fs = require('fs')
// path: construir rutas de archivos sin depender del sistema operativo
const path = require('path')

// recibe la descripción en inglés y devuelve los bytes de la imagen (async por el fetch)
// paso 1: leer la configuración que cargó el .env
async function generarImagen(descripcion) {
    const apiKey = process.env.IMAGEN_API_KEY;
    const url = process.env.IMAGEN_URL;

    // si falta la clave o la URL, se lanza un error y no se hace la petición
    if (!apiKey || !url) {
        throw new Error('Faltan variables IMAGEN_* en el archivo .env');
    }
    // paso 2: enviar la descripción al modelo de imágenes
    const respuesta = await fetch(url, {
        // POST porque se envía un cuerpo con datos
        method: 'POST',
        headers: {
            // el cuerpo va en formato JSON
            'Content-Type': 'application/json',
            // la clave se envía con el formato Bearer
             Authorization: `Bearer ${apiKey}`
        },
        // JSON.stringify convierte el objeto en texto JSON
        body: JSON.stringify({
            // prompt: la descripción; steps: pasos de generación del modelo
            prompt: descripcion,
            steps: 4
            
        }),
        // límite de 60 segundos: si se pasa, fetch lanza TimeoutError
        signal: AbortSignal.timeout(60000)
    });
    // paso 3: revisar que el servicio respondió bien
    // ok es true solo si el código HTTP está entre 200 y 299
    if (!respuesta.ok) {
        // crear el error en una variable con un mensaje descriptivo
        const error = new Error(`El modelo de imagenes respondío con error ${respuesta.status}`);
        // agregarle el código de estado (lo usa explicarError en index.js)
        error.status = respuesta.status;
        // agregarle el encabezado retry-after (puede ser null)
        error.retryAfter = respuesta.headers.get('retry-after');
        // lanzar el error para que lo atrape el catch de main
        throw error;

    }
    // paso 4: sacar la imagen de la respuesta
    // convierte el cuerpo de la respuesta en un objeto
    const datos = await respuesta.json();

    // valida que venga la imagen; si no, muestra qué campos llegaron
    if (!datos.result || !datos.result.image) {
        throw new Error(`Cloudflare no devolvió una imagen. Campos recibidos: ${Object.keys(datos).join(', ')}`);
    }
    // paso 5: convertir el texto base64 en bytes
    const bytes = Buffer.from(datos.result.image, 'base64');

    // valida que la imagen no esté vacía
    if (bytes.length === 0) {
        throw new Error('El modelo de imágenes devolvió una imagen vacía');
    }

    return bytes;
}

// devuelve la ruta donde va la imagen: imagenes/mundo_<id>.jpg
// __dirname es la carpeta de este archivo (src); '..' sube a la raíz del proyecto
function rutaImagen(id) {
    const carpetaImg = path.join(__dirname, '..', 'imagenes');
    return path.join(carpetaImg, `mundo_${id}.jpg`);
}

// escribe los bytes en el .jpg y devuelve la ruta
function guardarImagen(id, bytes) {
    // 1. Obtenemos la ruta completa del archivo usando solo el id
    const imagen = rutaImagen(id);
    
    // 2. Extraemos la carpeta usando path.dirname
    const carpetaImg = path.dirname(imagen);
    
    // 3. Creamos la carpeta (recursive: no falla si ya existe) y escribimos el archivo
    fs.mkdirSync(carpetaImg, { recursive: true });
    fs.writeFileSync(imagen, bytes);
    
    return imagen;
}

// exporta las funciones para que index.js las use con require (CommonJS)
module.exports = {
    generarImagen,
    rutaImagen,
    guardarImagen

 };