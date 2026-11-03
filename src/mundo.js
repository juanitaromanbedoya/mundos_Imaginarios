// object-hash: genera un identificador a partir del contenido de un objeto
const hash = require('object-hash');
// fs: leer/escribir archivos y carpetas
const fs = require('fs');
// path: construir rutas de archivos sin depender del sistema operativo
const path = require('path');

// Función auxiliar para centralizar los errores y el ejemplo de uso
// muestra el mensaje de error, el ejemplo de uso y marca el código de salida en 1
function mostrarError(mensaje) {
  console.log(`Error: ${mensaje}`);
  console.log('Ejemplo de uso: npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta');
  process.exitCode = 1;
}

// valida los 7 argumentos (situación, mundo y 5 colores) y devuelve el objeto del mundo
// si algo falla, muestra el error y devuelve undefined (index.js detiene el programa)
function crearMundo(args) {
  // validación 1: cantidad exacta de argumentos
  if (args.length !== 7) {
    mostrarError(`Llegaron ${args.length} argumentos, pero se esperaban exactamente 7.`);
    return; 
  }

  // validación 2: ningún argumento vacío (trim quita los espacios de los extremos)
  for (let i = 0; i < args.length; i++) {
    if (args[i].trim().length === 0) {
      mostrarError(`El argumento en la posición ${i + 1} está vacío.`);
      return; 
    }
  }

  // los colores son los argumentos desde la posición 2; se limpian y pasan a minúscula
  const colores = args.slice(2).map(color => color.trim().toLowerCase());
  // Set elimina los repetidos: si su tamaño es menor, había colores repetidos
  const coloresUnicos = new Set(colores);

  // validación 3: los colores deben ser distintos
  if (coloresUnicos.size !== colores.length){
    mostrarError("Los 5 colores no se pueden repetir, deben de ser únicos");
    return;
  }

  // args[0] es la situación y args[1] es el mundo
  const situacion = args[0].trim();
  const mundo = args[1].trim();

  // id: hash de los datos (sin la fecha) y se toman 8 caracteres
  // así los mismos datos siempre dan el mismo id
  const id = hash({ situacion, mundo, colores }).slice(0, 8);

  // objeto del mundo con los 5 campos; creadoEn queda fuera del hash
  return {
    id,
    situacion,
    mundo,
    colores,
    creadoEn: new Date().toISOString()
  };
}

// guarda el mundo en data/mundo_<id>.json y devuelve la ruta
function guardarMundo(mundo){
    // carpeta data/ en la raíz del proyecto (__dirname es src; '..' sube un nivel)
    const carpeta = path.join(__dirname, '..', 'data');
    // crea la carpeta si no existe (recursive: no falla si ya existe)
    fs.mkdirSync(carpeta, { recursive: true});
    
    const archivo = path.join(carpeta, `mundo_${mundo.id}.json`);
    
    // solo escribe si el archivo no existe (no se sobrescribe el mismo mundo)
    if (!fs.existsSync(archivo)) {
        // JSON.stringify convierte el objeto en texto; null, 2 lo deja indentado
        fs.writeFileSync(archivo, JSON.stringify(mundo, null, 2));
    }
    return archivo;
}

// lee el JSON desde el archivo y lo devuelve como objeto
function leerMundo (ruta) {
    // lee el archivo como texto
    const contenidoTexto = fs.readFileSync(ruta, 'utf8');
    // JSON.parse convierte el texto en objeto
    const objetoMundo = JSON.parse(contenidoTexto);
    return objetoMundo;
}

// NUEVA FUNCIÓN: Listar todos los mundos guardados leyendo la carpeta data/
function listarMundos() {
    const carpeta = path.join(__dirname, '..', 'data');
    
    // si la carpeta no existe todavía, no hay mundos
    if (!fs.existsSync(carpeta)) {
        return [];
    }
    
    // nombres de todos los archivos de la carpeta
    const archivos = fs.readdirSync(carpeta);
    // se queda solo con los que se llaman mundo_*.json
    const archivosJson = archivos.filter(archivo => archivo.startsWith('mundo_') && archivo.endsWith('.json'));
    
    // lee cada archivo y lo convierte en objeto
    const mundos = archivosJson.map(archivo => {
        const rutaArchivo = path.join(carpeta, archivo);
        const contenido = fs.readFileSync(rutaArchivo, 'utf8');
        return JSON.parse(contenido);
    });
    
    return mundos;
}

// exporta las funciones para que index.js las use con require (CommonJS)
module.exports = {
    crearMundo,
    guardarMundo,
    leerMundo,
    listarMundos 
};