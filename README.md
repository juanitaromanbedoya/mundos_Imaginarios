# mundos-ia
 Es un programa de consola en Node.js que genera bocetos visuales de mundos imaginarios con inteligencia artificial.

## Qué hace

Recibe por la terminal una situación (descripción), un mundo y 5 colores, y ejecuta tres pasos en orden:

1. Guarda los datos en un objeto JSON: `data/mundo_<id>.json`.
2. Lee ese JSON y se lo envía a un modelo de lenguaje, que escribe la descripción de una imagen. Se guarda en `descripciones/mundo_<id>.txt`.
3. Envía esa descripción a un modelo de generación de imágenes y guarda el resultado en `imagenes/mundo_<id>.jpg`.

El `id` se calcula con `object-hash` a partir de la situación, el mundo y los colores. Los mismos datos siempre producen el mismo `id`, y eso permite reutilizar archivos ya generados.

## Requisitos

- Node.js 20.12 o superior (`node -v`)
- npm y Git
- Una cuenta gratuita en Groq y otra en Cloudflare (ver "Servicios utilizados")

## Instalación y configuración

1. Instala las dependencias:

```
npm install
```

2. Copia `.env.example` a `.env` y completa los valores:

```
TEXTO_API_KEY=tu_clave_de_groq
TEXTO_URL=https://api.groq.com/openai/v1/chat/completions
TEXTO_MODELO=openai/gpt-oss-20b
IMAGEN_API_KEY=tu_token_de_cloudflare
IMAGEN_URL=https://api.cloudflare.com/client/v4/accounts/TU_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-schnell
```

| Variable | Qué es |
|---|---|
| `TEXTO_API_KEY` | Clave de Groq (empieza con `gsk_`) |
| `TEXTO_URL` | Dirección de la API de texto |
| `TEXTO_MODELO` | Modelo de lenguaje que escribe la descripción |
| `IMAGEN_API_KEY` | Token de Cloudflare Workers AI |
| `IMAGEN_URL` | Dirección de la API de imágenes, con tu Account ID de Cloudflare |

El archivo `.env` contiene claves privadas. Está en `.gitignore` y nunca debe subirse a Git.

## Cómo usarlo

```
npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>
```

Ejemplo:

```
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Las comillas son necesarias: sin ellas, cada palabra de la situación o del mundo llega como un argumento distinto.

Salida esperada:

```
Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
Paso 2: descripción guardada en descripciones/mundo_3f9a1c2e.txt
Paso 3: imagen guardada en imagenes/mundo_3f9a1c2e.jpg
Listo. Revisa la carpeta imagenes/
```

### Validaciones

El programa termina con un mensaje claro si:

- No llegan exactamente 7 argumentos.
- Algún argumento está vacío o tiene solo espacios.
- Los 5 colores no son distintos (sin distinguir mayúsculas de minúsculas).

### Ahorro de cuota

Si ejecutas el mismo comando otra vez, el programa no vuelve a llamar a las APIs, porque reutiliza los archivos que ya existen:

```
Paso 1: mundo guardado en data/mundo_3f9a1c2e.json
Paso 2: la descripción ya existía, no se llamó al modelo de texto.
Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.
```
Si un paso falla, los archivos de los pasos anteriores se conservan, y al ejecutar de nuevo el programa continúa desde donde quedó.

### Errores explicados

| Situación | Mensaje |
|---|---|
| Clave inválida o sin permisos (401, 403) | La API key no es válida. Revisa tu archivo .env. |
| Límite de uso (402, 429) | Superaste el límite gratuito. Espera un momento. |
| Modelo o URL incorrectos (404, 410) | El modelo o la URL no existen. Revisa tu configuración. |
| Sin conexión o URL mal escrita | No se pudo conectar. Revisa tu internet o la URL. |
| Se acabó el tiempo de espera | El servicio tardó demasiado en responder. |

Las claves nunca se imprimen en la consola ni aparecen en los mensajes de error.

## Estructura de carpetas

```
mundos-ia/
├── src/
│   ├── index.js     # orquesta los pasos 1 a 3 y explica los errores
│   ├── mundo.js     # valida los argumentos, crea el objeto, lo guarda y lo lee
│   ├── texto.js     # consulta al modelo de lenguaje y guarda la descripción
│   └── imagen.js    # consulta al modelo de imágenes y guarda la imagen
├── data/            # JSON de cada mundo (se crea solo, no va a Git)
├── descripciones/   # descripciones .txt (se crea sola, no va a Git)
├── imagenes/        # imágenes .jpg (se crea sola, no va a Git)
├── .env             # tus claves (NO va a Git)
├── .env.example     # plantilla de las variables, sin claves reales
├── .gitignore
├── package.json
└── README.md
```

## Servicios utilizados

- **Texto: Groq**, modelo `openai/gpt-oss-20b`. Plan gratuito con límites por minuto y por día. Consola y clave: https://console.groq.com

- **Imagen: Cloudflare Workers AI**, modelo FLUX.1-schnell. Cuota gratuita diaria en "neuronas". Panel: https://dash.cloudflare.com y documentación: https://developers.cloudflare.com/workers-ai/

## Experimento: .gitignore

Se ejecutó `npm publish --dry-run` dos veces para ver qué archivos se empaquetan.

**Con `.gitignore`:** 7 archivos y 5.8 kB. Solo se incluyen `package.json`, `README.md`, `.env.example` y los cuatro archivos de `src/`. El archivo `.env` y las carpetas `data/`, `descripciones/` e `imagenes/` quedan fuera. npm usa el `.gitignore` cuando no existe un `.npmignore`.

**Sin `.gitignore`** (renombrado temporalmente a `.gitignore.off`): 15 archivos y 1.6 MB. Aparecen `.env`, los JSON, los textos y las imágenes generadas.

**Por qué es peligroso:** si se publica así, el archivo `.env` con las claves privadas queda público en el registro de npm. Cualquier persona podría descargarlo y usar las claves, gastando la cuota o poniendo en riesgo las cuentas. Además se publicarían archivos pesados que no hacen parte del programa. Si una clave se filtra, hay que revocarla y crear otra. Por eso `.env`, `data/`, `descripciones/` e `imagenes/` deben estar siempre en `.gitignore` antes de publicar o de hacer un commit.

El experimento se hizo solo con `--dry-run`, así que no se publicó nada, y el `.gitignore` se restauró después.