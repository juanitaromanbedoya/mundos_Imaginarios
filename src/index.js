// carga las variables del archivo .env en process.env
process.loadEnvFile();

// fs: módulo de Node para leer y comprobar archivos
const fs = require('fs');
// módulo mundo: validar argumentos, crear, guardar, leer y listar el JSON
const { crearMundo, guardarMundo, leerMundo, listarMundos } = require('./mundo');
// módulo texto: llamar al modelo de texto (describir y traducir) y guardar los .txt
const { describirMundo, guardarDescripcion, rutaDescripcion, traducirDescripcion,  guardarDescripcionEs, rutaDescripcionEs } = require('./texto');
// módulo imagen: llamar al modelo de imágenes y guardar el .jpg
const { generarImagen, guardarImagen, rutaImagen } = require('./imagen');

// argumentos escritos en la terminal (se descartan la ruta de node y la del script)
const args = process.argv.slice(2);

// traduce un error técnico a un mensaje en español 
// recibe el error del catch y devuelve el mensaje.
function explicarError(error) {
    
    if (error.name === 'TimeoutError') {
        return 'El servicio tardó demasiado en responder.';
    }
    
    if (error.name === 'TypeError') {
        return 'No se pudo conectar. Revisa tu internet o la URL.';
    }
    
    if (error.status === 401 || error.status === 403) {
        return 'La API key no es válida. Revisa tu archivo .env.';
    }

    if (error.status === 402 || error.status === 429) {
        if (error.retryAfter) {
            return `Superaste el límite gratuito. Espera ${error.retryAfter} segundos e inténtalo de nuevo.`;
        }
        return 'Superaste el límite gratuito. Espera un momento e inténtalo de nuevo.';
    }
    
    if (error.status === 404 || error.status === 410) {
        return 'El modelo o la URL no existen. Revisa tu configuración.';
    }
    
    return error.message;
}

// función principal: inicia todo el flujo (async porque usa await con las APIs)
async function main() {
    try {
        // comando "listar": muestra los mundos guardados y termina
        if (args[0] === 'listar'){
            const mundos = listarMundos();
            if (mundos.length === 0){
                console.log('No hay mundos creados todavía');
                return;
            }

            console.log('\n-- MUNDOS GUARDADOS --');
            // forEach: una vez por mundo (m = mundo, index = posición desde 0)
            mundos.forEach((m,index) => {
                console.log(`${index + 1}. [ID: ${m.id}] ${m.mundo}`);
                console.log(` Situación: ${m.situacion}`);
                // join convierte el arreglo de colores en un solo texto
                console.log(` Colores: ${m.colores.join(', ')}`);
            });
            return;
        }
        // paso 1: validar los argumentos y crear el objeto del mundo
        const mundo = crearMundo(args);
        // si la validación falla, se detiene el programa
        if (!mundo) {
            return;
        }

        // paso 2: guardar el mundo y lo relee desde el archivo
        // (así se trabaja con lo que realmente quedó guardado)
        const ruta = guardarMundo(mundo);
        const mundoLeido = leerMundo(ruta);
        console.log(`Paso 1: mundo guardado en data/mundo_${mundoLeido.id}.json`);

        // paso 3: descripción en inglés, solo se llama al modelo si el .txt no existe
        // (ahorro de cuota: el id es el mismo para los mismos datos)
        const rutaTxt = rutaDescripcion(mundoLeido.id);
        let descripcionIngles;
        if (fs.existsSync(rutaTxt)) {
            // ya existe: se lee del archivo, sin llamar a la API
            descripcionIngles = fs.readFileSync(rutaTxt, 'utf8');
            console.log('Paso 2: la descripción en inglés ya existía, no se llamó al modelo de texto.');
        } else {
            // no existe: se pide al modelo (await) y se guarda en el .txt
            descripcionIngles = await describirMundo(mundoLeido);
            guardarDescripcion(mundoLeido.id, descripcionIngles);
            console.log(`Paso 2: descripción guardada en descripciones/mundo_${mundoLeido.id}.txt`);
        }

        // paso 3.2: descripción en español, usando caché y traduciendo desde el texto en inglés
        const rutaTxtEs = rutaDescripcionEs(mundoLeido.id);
        if (fs.existsSync(rutaTxtEs)) {
            console.log('Paso 2: la descripción en español ya existía, no se llamó al modelo de texto.');
        } else {
            const descripcionEspanol = await traducirDescripcion(descripcionIngles);
            guardarDescripcionEs(mundoLeido.id, descripcionEspanol);
            console.log(`Paso 2: descripción en español guardada en descripciones/mundo_${mundoLeido.id}_es.txt`);
        }

        // paso 4: imagen, solo se llama al modelo si el .jpg no existe
        const rutaImg = rutaImagen(mundoLeido.id);
        if (fs.existsSync(rutaImg)) {
            // ya existe: no se llama a la API de imágenes
            console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
        } else {
            // se lee la descripción en inglés guardada, se genera la imagen (bytes) y se guarda como .jpg
            const descripcionGuardada = fs.readFileSync(rutaTxt, 'utf8');
            const bytes = await generarImagen(descripcionGuardada);
            guardarImagen(mundoLeido.id, bytes);
            console.log(`Paso 3: imagen guardada en imagenes/mundo_${mundoLeido.id}.jpg`);
        }

        console.log('Listo. Revisa la carpeta imagenes/ y descripciones/');
    } catch (error) {
        // paso 5: explicar el error en español y marcar el código de salida
        // exitCode = 1 indica que terminó con error (sin cortar el programa de golpe)
        console.log(`Error: ${explicarError(error)}`);
        process.exitCode = 1;
    }
}

// ejecuta el programa
main();