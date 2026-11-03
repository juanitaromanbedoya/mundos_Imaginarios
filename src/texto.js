// fs: leer/escribir archivos y crear carpetas
const fs = require('fs');
// path: construir rutas de archivos sin depender del sistema operativo
const path = require('path');

// recibe el objeto del mundo y devuelve la descripción en inglés (async por el fetch)
// paso 1: leer la configuración que cargó el .env
async function describirMundo(mundo) {
    const apiKey = process.env.TEXTO_API_KEY;
    const url = process.env.TEXTO_URL;
    const modelo = process.env.TEXTO_MODELO;

    // si falta alguna variable, se lanza un error y no se hace la petición
    if (!apiKey || !url || !modelo) {
        throw new Error('Faltan variables TEXTO_* en el archivo .env');
    }
    // paso 2: mensaje de sistema (las instrucciones que se le dan al modelo)
    // pide: un párrafo en inglés, 80 a 120 palabras, solo una escena visual, los 5 colores y sin formato
    const mensajeSistema = `Tu tarea es generar una descripción visual detallada basada en los datos del usuario. Debes seguir estrictamente estas reglas: 1. Escribe la respuesta en un único párrafo y enteramente en inglés. 2. La extensión debe ser de entre 80 y 120 palabras. 3. Describe únicamente una escena visual (escena, elementos, iluminación, composición y estilo artístico), sin tramas, cuentos ni historias. 4. Incorpora de forma natural los 5 colores indicados (traducidos al inglés). 5. No incluyas títulos, ni formato markdown,no use asteriscos ni ningún símbolo de formato, ni texto escrito dentro de la imagen. Devuelve únicamente el párrafo plano.`;

    // paso 3: enviar la petición al modelo
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
            // modelo a usar (viene del .env)
            model: modelo,
            messages: [
                // system: las reglas; user: los datos del mundo en JSON
                { role: 'system', content: mensajeSistema },
                { role: 'user', content: JSON.stringify(mundo) }
            ]
        }),
        // límite de 30 segundos: si se pasa, fetch lanza TimeoutError
        signal: AbortSignal.timeout(30000)
    });

    // paso 4: revisar que el servicio respondió bien
    // ok es true solo si el código HTTP está entre 200 y 299
   if (!respuesta.ok) {
    // crea una variable que almacena el error
    const error = new Error(`El modelo de texto respondió con error ${respuesta.status}`);
    //agrega el codigo del estado (lo usa explicarError en index.js)
    error.status = respuesta.status;

    // encabezado retry-after: segundos de espera (puede ser null)
    error.retryAfter = respuesta.headers.get('retry-after');
    //lanza el error para que lo atrape el catch de main
    throw error;
}

    // paso 5: sacar el texto de la respuesta
    // convierte el cuerpo en objeto; el texto está en choices[0].message.content
    const datos = await respuesta.json();
    let descripcion = datos.choices[0].message.content.trim();

    // paso 6: validar la descripción
    // no puede venir vacía
    if (descripcion.length === 0) {
        throw new Error('El modelo devolvió una descripción vacía');
    }
    // si supera 1500 caracteres, se recorta y se avisa
    if (descripcion.length > 1500) {
        descripcion = descripcion.slice(0, 1500);
        console.log('Aviso: la descripción superaba 1500 caracteres y se recortó.');
    }

    return descripcion;
}

// devuelve la ruta de la descripción en inglés: descripciones/mundo_<id>.txt
// __dirname es la carpeta de este archivo (src); '..' sube a la raíz del proyecto
function rutaDescripcion(id) {
    const carpetaDes = path.join(__dirname, '..', 'descripciones');
    return path.join(carpetaDes, `mundo_${id}.txt`);
}

// escribe la descripción en inglés en su .txt y devuelve la ruta
function guardarDescripcion(id, descripcion) {
    // 1. Obtenemos la ruta completa del archivo usando solo el id
    const archivo = rutaDescripcion(id);
    
    // 2. Extraemos la carpeta usando path.dirname
    const carpetaDes = path.dirname(archivo);
    
    // 3. Creamos la carpeta (recursive: no falla si ya existe) y escribimos el archivo
    fs.mkdirSync(carpetaDes, { recursive: true });
    fs.writeFileSync(archivo, descripcion);
    
    return archivo;
}

// Ruta específica para la descripción en español (terminada en _es.txt)
function rutaDescripcionEs(id) {
    const carpetaDes = path.join(__dirname, '..', 'descripciones');
    return path.join(carpetaDes, `mundo_${id}_es.txt`);
}

// Guardar la descripción en español en su propio archivo
function guardarDescripcionEs(id, descripcion) {
    const archivo = rutaDescripcionEs(id);
    const carpetaDes = path.dirname(archivo);
    
    fs.mkdirSync(carpetaDes, { recursive: true });
    fs.writeFileSync(archivo, descripcion);
    
    return archivo;
}

// Segunda llamada al modelo de texto para traducir la descripción al español
async function traducirDescripcion(descripcionIngles) {
    // misma configuración del .env que describirMundo
    const apiKey = process.env.TEXTO_API_KEY;
    const url = process.env.TEXTO_URL;
    const modelo = process.env.TEXTO_MODELO;

    if (!apiKey || !url || !modelo) {
        throw new Error('Faltan variables TEXTO_* en el archivo .env');
    }

    // instrucciones de traductor: mismo tono, un párrafo, sin formato
    const mensajeSistema = "Eres un traductor experto. Traduce el siguiente texto al español manteniendo exactamente el mismo tono visual, formato de un único párrafo, y una extensión similar (entre 80 y 120 palabras), sin agregar títulos, asteriscos ni formato markdown. Devuelve únicamente el texto traducido.";

    // misma petición que describirMundo, pero el mensaje del usuario es la descripción en inglés
    const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelo,
            messages: [
                { role: 'system', content: mensajeSistema },
                { role: 'user', content: descripcionIngles }
            ]
        }),
        signal: AbortSignal.timeout(30000)
    });

    // si la respuesta no es ok, se crea el error con status y retryAfter
    if (!respuesta.ok) {
        const error = new Error(`El modelo de texto respondió con error ${respuesta.status}`);
        error.status = respuesta.status;
        error.retryAfter = respuesta.headers.get('retry-after');
        throw error;
    }

    // el texto traducido está en choices[0].message.content
    const datos = await respuesta.json();
    let descripcionEs = datos.choices[0].message.content.trim();

    // la traducción no puede venir vacía
    if (descripcionEs.length === 0) {
        throw new Error('El modelo devolvió una traducción vacía');
    }

    return descripcionEs;
}

// exporta las funciones para que index.js las use con require (CommonJS)
module.exports = {
    describirMundo,
    guardarDescripcion,
    rutaDescripcion,
    traducirDescripcion,
    guardarDescripcionEs,
    rutaDescripcionEs
};