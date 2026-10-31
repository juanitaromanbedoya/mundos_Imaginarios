const hash = require('object-hash');
const fs = require('fs');
const path = require('path');
const { arch } = require('os');


// Función auxiliar para centralizar los errores y el ejemplo de uso
function mostrarError(mensaje) {
  console.log(`Error: ${mensaje}`);
  console.log('Ejemplo de uso: npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta');
  process.exitCode = 1;
}

function crearMundo(args) {
  if (args.length !== 7) {
    mostrarError(`Llegaron ${args.length} argumentos, pero se esperaban exactamente 7.`);
    return; 
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i].trim().length === 0) {
      mostrarError(`El argumento en la posición ${i + 1} está vacío.`);
      return; 
    }
  }

  const colores = args.slice(2).map(color => color.trim().toLowerCase());
  const coloresUnicos = new Set(colores);

  if (coloresUnicos.size !== colores.length){
    mostrarError("Los 5 colores no se pueden repetir, deben de ser únicos");
    return;
  }

  const situacion = args[0].trim();
  const mundo = args[1].trim();

  const id = hash({ situacion, mundo, colores }).slice(0, 8);

  return {
    id,
    situacion,
    mundo,
    colores,
    creadoEn: new Date().toISOString()
  };
}

function guardarMundo(mundo){
    const carpeta = path.join(__dirname, '..', 'data');
    fs.mkdirSync(carpeta, { recursive: true});
    
    const archivo = path.join(carpeta, `mundo_${mundo.id}.json`);
    fs.writeFileSync(archivo, JSON.stringify(mundo, null, 2));
    return archivo;
}

function leerMundo (ruta) {
    const contenidoTexto = fs.readFileSync(ruta, 'utf8');
    const objetoMundo = JSON.parse(contenidoTexto);
    return objetoMundo;
}

module.exports = {
    crearMundo,
    guardarMundo,
    leerMundo
}