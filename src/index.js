process.loadEnvFile();
const fs = require('fs');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo, guardarDescripcion, rutaDescripcion } = require('./texto');
const { generarImagen, guardarImagen, rutaImagen } = require('./imagen');

const args = process.argv.slice(2);

// traduce un error técnico a un mensaje en español 
function explicarError(error) {
    // el tiempo de espera se acabó
    if (error.name === 'TimeoutError') {
        return 'El servicio tardó demasiado en responder.';
    }
    // no hubo conexión o la URL está mal escrita
    if (error.name === 'TypeError') {
        return 'No se pudo conectar. Revisa tu internet o la URL.';
    }
    // clave inválida o sin permisos
    if (error.status === 401 || error.status === 403) {
        return 'La API key no es válida. Revisa tu archivo .env.';
    }
    // límite de uso
    if (error.status === 402 || error.status === 429) {
        if (error.retryAfter) {
            return `Superaste el límite gratuito. Espera ${error.retryAfter} segundos e inténtalo de nuevo.`;
        }
        return 'Superaste el límite gratuito. Espera un momento e inténtalo de nuevo.';
    }
    // modelo o URL incorrectos
    if (error.status === 404 || error.status === 410) {
        return 'El modelo o la URL no existen. Revisa tu configuración.';
    }
    // cualquier otro error (son mensajes propios, en español)
    return error.message;
}

async function main() {
    try {
        // paso 1: validar los argumentos y crear el objeto del mundo
        const mundo = crearMundo(args);
        if (!mundo) {
            return;
        }

        // paso 2: guardar el mundo y volver a leerlo desde el archivo
        const ruta = guardarMundo(mundo);
        const mundoLeido = leerMundo(ruta);
        console.log(`Paso 1: mundo guardado en data/mundo_${mundoLeido.id}.json`);

        // paso 3: descripción, solo se llama al modelo si el .txt no existe
        const rutaTxt = rutaDescripcion(mundoLeido.id);
        if (fs.existsSync(rutaTxt)) {
            console.log('Paso 2: la descripción ya existía, no se llamó al modelo de texto.');
        } else {
            const descripcion = await describirMundo(mundoLeido);
            guardarDescripcion(mundoLeido.id, descripcion);
            console.log(`Paso 2: descripción guardada en descripciones/mundo_${mundoLeido.id}.txt`);
        }

        // paso 4: imagen, solo se llama al modelo si el .jpg no existe
        const rutaImg = rutaImagen(mundoLeido.id);
        if (fs.existsSync(rutaImg)) {
            console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
        } else {
            const descripcionGuardada = fs.readFileSync(rutaTxt, 'utf8');
            const bytes = await generarImagen(descripcionGuardada);
            guardarImagen(mundoLeido.id, bytes);
            console.log(`Paso 3: imagen guardada en imagenes/mundo_${mundoLeido.id}.jpg`);
        }

        console.log('Listo. Revisa la carpeta imagenes/');
    } catch (error) {
        // paso 5: explicar el error en español y marcar el código de salida
        console.log(`Error: ${explicarError(error)}`);
        process.exitCode = 1;
    }
}

main();