const fs = require('fs');
const path = require('path');

async function describirMundo(mundo) {
    const apiKey = process.env.TEXTO_API_KEY;
    const url = process.env.TEXTO_URL;
    const modelo = process.env.TEXTO_MODELO;

    if (!apiKey || !url || !modelo) {
        throw new Error('Faltan variables TEXTO_* en el archivo .env');
    }
    // paso 2: mensaje de sistema (el que escribes tú)
    const mensajeSistema = `Tu tarea es generar una descripción visual detallada basada en los datos del usuario. Debes seguir estrictamente estas reglas: 1. Escribe la respuesta en un único párrafo y enteramente en inglés. 2. La extensión debe ser de entre 80 y 120 palabras. 3. Describe únicamente una escena visual (escena, elementos, iluminación, composición y estilo artístico), sin tramas, cuentos ni historias. 4. Incorpora de forma natural los 5 colores indicados (traducidos al inglés). 5. No incluyas títulos, ni formato markdown,no use asteriscos ni ningún símbolo de formato, ni texto escrito dentro de la imagen. Devuelve únicamente el párrafo plano.`;

    // paso 3: enviar la petición al modelo
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
                { role: 'user', content: JSON.stringify(mundo) }
            ]
        }),
        signal: AbortSignal.timeout(30000)
    });

    // paso 4: revisar que el servicio respondió bien
    if (!respuesta.ok) {
        throw new Error(`El modelo de texto respondió con error ${respuesta.status}`);
    }

    // paso 5: sacar el texto de la respuesta
    const datos = await respuesta.json();
    let descripcion = datos.choices[0].message.content.trim();

    // paso 6: validar la descripción
    if (descripcion.length === 0) {
        throw new Error('El modelo devolvió una descripción vacía');
    }
    if (descripcion.length > 1500) {
        descripcion = descripcion.slice(0, 1500);
        console.log('Aviso: la descripción superaba 1500 caracteres y se recortó.');
    }

    return descripcion;
}

function rutaDescripcion(id) {
    const carpetaDes = path.join(__dirname, '..', 'descripciones');
    return path.join(carpetaDes, `mundo_${id}.txt`);
}

function guardarDescripcion(id, descripcion) {
    // 1. Obtenemos la ruta completa del archivo usando solo el id
    const archivo = rutaDescripcion(id);
    
    // 2. Extraemos la carpeta usando path.dirname
    const carpetaDes = path.dirname(archivo);
    
    // 3. Creamos la carpeta y escribimos el archivo
    fs.mkdirSync(carpetaDes, { recursive: true });
    fs.writeFileSync(archivo, descripcion);
    
    return archivo;
}

module.exports = {
    describirMundo,
    guardarDescripcion,
    rutaDescripcion
};