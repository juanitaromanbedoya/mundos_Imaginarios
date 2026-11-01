const fs = require('fs')
const path = require('path')

// paso 1: leer la configuración que cargó el .env
async function generarImagen(descripcion) {
    const apiKey = process.env.IMAGEN_API_KEY;
    const url = process.env.IMAGEN_URL;

    if (!apiKey || !url) {
        throw new Error('Faltan variables IMAGEN_* en el archivo .env');
    }
    // paso 2: enviar la descripción al modelo de imágenes
    const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
             Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: descripcion,
            steps: 4
            
        }),
        signal: AbortSignal.timeout(60000)
    });
    // paso 3: revisar que el servicio respondió bien
    if (!respuesta.ok) {
        //crear el error en una variable (con tu mismo mensaje)
        const error = new Error(`El modelo de imagenes respondío con error ${respuesta.status}`);
        // agregarle el código de estado
        error.status = respuesta.status;
        //  agregarle el encabezado retry-after (puede ser null)
        error.retryAfter = respuesta.headers.get('retry-after');
        // lanza el error
        throw error;

    }
    // paso 4: sacar la imagen de la respuesta
    const datos = await respuesta.json();

    if (!datos.result || !datos.result.image) {
        throw new Error(`Cloudflare no devolvió una imagen. Campos recibidos: ${Object.keys(datos).join(', ')}`);
    }
    // paso 5: convertir el texto base64 en bytes
    const bytes = Buffer.from(datos.result.image, 'base64');

    if (bytes.length === 0) {
        throw new Error('El modelo de imágenes devolvió una imagen vacía');
    }

    return bytes;
}

function rutaImagen(id) {
    const carpetaImg = path.join(__dirname, '..', 'imagenes');
    return path.join(carpetaImg, `mundo_${id}.jpg`);
}

function guardarImagen(id, bytes) {
    // 1. Obtenemos la ruta completa del archivo usando solo el id
    const imagen = rutaImagen(id);
    
    // 2. Extraemos la carpeta usando path.dirname
    const carpetaImg = path.dirname(imagen);
    
    // 3. Creamos la carpeta y escribimos el archivo
    fs.mkdirSync(carpetaImg, { recursive: true });
    fs.writeFileSync(imagen, bytes);
    
    return imagen;
}

module.exports = {
    generarImagen,
    rutaImagen,
    guardarImagen

 };