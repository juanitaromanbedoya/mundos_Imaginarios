process.loadEnvFile();
const fs = require('fs');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo, guardarDescripcion, rutaDescripcion } = require('./texto');
const { generarImagen, guardarImagen, rutaImagen } = require('./imagen');

const args = process.argv.slice(2);

async function main() {
    const mundo = crearMundo(args);

    if (mundo) {
        const ruta = guardarMundo(mundo);
        const mundoLeido = leerMundo(ruta);

        console.log(`mundo guardado en data/mundo_${mundoLeido.id}.json`);

        try {
            // Paso 4: calcular dónde estaría la descripción usando el id del mundo leído
            const rutaTxt = rutaDescripcion(mundoLeido.id);

            // Paso 5: si el .txt ya existe, se lee de la caché; si no, se llama a la API y se guarda
            let descripcion;
            if (fs.existsSync(rutaTxt)) {
                descripcion = fs.readFileSync(rutaTxt, 'utf8');
                console.log('La descripción ya existía, no se llamó al modelo de texto.');
            } else {
                descripcion = await describirMundo(mundoLeido);
                guardarDescripcion(mundoLeido.id, descripcion);
                console.log(`Descripción guardada en descripciones/mundo_${mundoLeido.id}.txt`);
            }
            // paso 6: leer la descripción guardada en el .txt
            const descripcionGuardada = fs.readFileSync(rutaTxt, 'utf8');

            // paso 7: calcular dónde estaría la imagen
            const rutaImg = rutaImagen(mundoLeido.id);

            // paso 8: si la imagen ya existe no se llama al modelo; si no, se genera y se guarda
            if (fs.existsSync(rutaImg)) {
                console.log('La imagen ya existía, no se llamó al modelo de imágenes.');
            } else {
                const bytes = await generarImagen(descripcionGuardada);
                guardarImagen(mundoLeido.id, bytes);
                console.log(`Imagen guardada en imagenes/mundo_${mundoLeido.id}.jpg`);
            }

            console.log('Listo. Revisa la carpeta imagenes/');

        } catch (error) {
            console.log(`Error: ${error.message}`);
            process.exitCode = 1;
        }
    }
}

main();