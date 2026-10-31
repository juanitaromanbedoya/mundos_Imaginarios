const {crearMundo, guardarMundo, leerMundo} = require('./mundo')

const args = process.argv.slice(2);

const mundo = crearMundo(args);


if (mundo) {
  const ruta = guardarMundo (mundo)
  const mundoLeido = leerMundo (ruta)
  console.log(mundoLeido);
}



