# PROMPT.md

## A. Declaración

Usé IA: **sí**.

## B. Herramienta y modelo

Claude, de Anthropic, usado en la aplicación de chat (claude.ai). Modelo: Sonnet 5.5 

## C. Prompt inicial (copiado literal)

```
Actúa como un instructor de Node.js para principiantes del SENA.
Quiero construir un programa de consola llamado "mundos-ia".

Reglas estrictas de nuestra dinámica:
1. NO me des el código completo de golpe ni hagas el trabajo por mí. 
2. Tu rol es ser una guía interactiva: dime exactamente qué pequeño paso dar (ej. "Primero vamos a crear el archivo X y validar process.argv").
3. Explícame con claridad la lógica detrás de cada concepto y por qué lo hacemos así, para que pueda entender el taller "de pies a cabeza".
4. A medida que vayamos avanzando y escribas una línea de código o un bloque nuevo, explícame detalladamente qué hace cada parte.
5. Permíteme escribir el código a mí. Dame la instrucción, espera a que yo lo intente o te pregunte, y corrígeme o guíame si es necesario.
6. Sigue estrictamente las restricciones técnicas del taller (nada de frameworks pesados como Express, ni librerías prohibidas como axios o dotenv; usaremos process.loadEnvFile, módulos nativos 'fs' y 'path', fetch nativo, etc.).

---

CONTEXTO: solo conozco estos temas: process.argv, módulos con require,
el módulo nativo fs (writeFileSync, readFileSync, existsSync, mkdirSync),
path, npm (init, install, scripts), el paquete object-hash, variables de
entorno con .env y process.loadEnvFile, async/await con try/catch y el fetch
nativo de Node.

OBJETIVO:
1. Recibir por parámetros una situación, un mundo y 5 colores, y guardarlos
   en un objeto JSON en data/mundo_<id>.json.
2. Leer ese JSON y enviarlo con fetch a la API de un modelo de lenguaje para
   que genere la descripción de una imagen. Guardarla en
   descripciones/mundo_<id>.txt.
3. Enviar esa descripción con fetch a la API de un modelo de imágenes y
   guardar la imagen en imagenes/mundo_<id>.jpg.

RESTRICCIONES:
- No uses dotenv, axios, SDK de proveedores, readline, commander ni frameworks.
- Código simple, con comentarios en español numerados ("paso 1", "paso 2"...).
- Las API keys se leen del archivo .env y nunca se escriben en el código.
- Si el .txt o la imagen ya existen, no vuelvas a llamar a las APIs.
- Divide el código en src/index.js, src/mundo.js, src/texto.js y src/imagen.js.

SERVICIOS: texto con <Groq o NVIDIA>, imagen con <NVIDIA FLUX.1-schnell o
Cloudflare>. (Pega aquí la ficha del servicio de la guía del taller.)

FORMA DE RESPONDER: dame un archivo a la vez, explica cada bloque en 2 líneas
y no uses nada que no esté en el CONTEXTO.
```

## D. Prompts siguientes más importantes

**1. Pedí que me guiara paso a paso, sin darme el código completo.**
La IA me explicó la dinámica y me dio el primer paso: crear la carpeta y ejecutar `npm init -y`. A partir de ahí escribí yo `index.js` y `mundo.js` (validaciones, objeto del mundo, `guardarMundo` y `leerMundo`), y la IA me corregía los errores.

**2. Pegué la Parte 3 del taller (consultar el JSON y pedir la descripción).**
La IA me dio `texto.js` completo, con un marcador donde iba el mensaje de sistema. Yo escribí el mensaje de sistema y las funciones `rutaDescripcion` y `guardarDescripcion`.

**3. Dije que NVIDIA daba timeout y pregunté por qué servicio cambiar.**
La IA recomendó Cloudflare Workers AI. Yo creé la cuenta, el token y el Account ID, actualicé el `.env` y adapté `imagen.js` a la forma de respuesta de Cloudflare.

**4. Pedí el `README.md` y la versión final de `index.js`.**
La IA los generó completos y yo los revisé y los ajusté. Declaro que esas dos partes no las escribí desde cero.

## E. Cambios que hice sobre lo que entregó la IA

1. Cambié el servicio de imágenes de NVIDIA a Cloudflare porque NVIDIA daba timeout después de más de 3 minutos, y adapté `imagen.js` (URL, cuerpo de la petición y `datos.result.image`).
2. Escribí mi propio mensaje de sistema para el modelo de texto y lo reforcé porque la descripción salía con asteriscos de markdown, que el taller prohíbe.
3. Corregí el nombre del paquete en `package.json` (`imagninarios` por `imaginarios`) y borré dos archivos vacíos que se crearon sin querer al pegar texto de la terminal.

## F. Una línea de código que no entendía

args.slice(2).map(color => color.trim().toLowerCase()): no entendia muy bien como funcionaba el slide(2)junto con el map

Buffer.from(datos.result.image, 'base64'):
no entiendo que es Buffer.from

## G. Un error y cómo lo resolví

Al probar `process.argv` me salió:

```
TypeError: Cannot read properties of undefined (reading 'argv')
```

Causa: yo había escrito `let process = []` al principio del archivo. Esa variable tapó el objeto `process` que trae Node, y `process.argv` dejó de existir. Lo resolví borrando esa línea.