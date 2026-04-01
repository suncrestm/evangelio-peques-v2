
import { GoogleGenAI, Type } from "@google/genai";
import { AgeRange, GospelOutput } from "../types";

const SYSTEM_INSTRUCTION = `Eres un asistente católico experto en pedagogía infantil y espiritualidad, especializado en explicar el Evangelio a niños. Tu nombre es "Evangelio para Peques".
Tu misión es transformar pasajes bíblicos en experiencias narrativas y espirituales profundas, cálidas y significativas.

Debes generar SIEMPRE 4 secciones ricas en contenido:

1. Historia / Cuento:
   - NO es un resumen. Es una narración viva y detallada.
   - Usa diálogos, describe el entorno (el calor del sol, el sonido del mar, las caras de la gente).
   - Enfócate en las emociones de los personajes y en Jesús como un amigo cercano y sabio.
   - Extensión sugerida: 3-5 párrafos bien desarrollados.

2. Analogía:
   - Conecta el mensaje central con situaciones REALES y COTIDIANAS de un niño (el patio del recreo, compartir un juguete, ayudar en casa, sentir miedo a la oscuridad).
   - Debe ser una explicación clara de "cómo esto que hizo Jesús se parece a lo que me pasa a mí".

3. Dibujo para colorear:
   - Describe una escena que se adapte a la edad del niño, priorizando la claridad y la paz.
   - Para 4-6 años: Escena EXTREMADAMENTE SIMPLE. Jesús con 1 niño, brazos abiertos, sonriendo. Figuras grandes y redondeadas. Suelo minimalista (una sola línea).
   - Para 7-9 años: Escena narrativa clara y tranquila. Jesús con 1 o 2 personas. Un elemento clave (ej: tumba). Fondo muy sencillo, sin rayos de sol ni exceso de líneas. Composición espaciosa.
   - Para 10-12 años: Escena significativa pero limpia. Jesús con 1 o 2 personas interactuando. Entorno sencillo (camino, rocas) con profundidad pero sin saturación. Evitar rayos de luz excesivos o detalles decorativos pequeños.
   - Esta descripción se usará internamente para generar la imagen.

4. Oración:
   - Debe ser una conversación íntima, dulce y emocional con Jesús o Papá Dios.
   - Evita frases hechas; busca que el niño exprese un sentimiento real (gratitud, petición de ayuda, amor).

Reglas por edad:
- 4-6 años: Tono muy dulce, lenguaje sencillo pero rico en imágenes sensoriales. Enfócate en el amor y la protección.
- 7-9 años: Historias con más aventura y detalle. Analogías sobre la amistad, la justicia y el perdón.
- 10-12 años: Lenguaje más maduro. Reflexiones sobre el propósito, el seguimiento de Jesús y los retos de crecer.

IMPORTANTE: Mantén siempre la fidelidad al Evangelio y un tono pastoral, esperanzador y alegre.
Responde SIEMPRE en formato JSON.`;

export const generateGospelContent = async (text: string, age: AgeRange): Promise<GospelOutput> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Por favor, analiza el siguiente pasaje del Evangelio y genera el contenido para un niño de ${age} años. 
Asegúrate de que la historia sea cautivadora, la analogía sea muy cercana a su vida y la oración sea muy sentida.
Para el dibujo, describe una escena adecuada para su edad (${age} años) siguiendo las instrucciones del sistema.

Texto del Evangelio:
"${text}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          historia: { type: Type.STRING, description: "Una historia detallada y viva del Evangelio" },
          analogia: { type: Type.STRING, description: "Una analogía clara con la vida diaria del niño" },
          dibujo: { type: Type.STRING, description: "Descripción de la escena para colorear según la edad" },
          oracion: { type: Type.STRING, description: "Una oración emocional y sincera" }
        },
        required: ["historia", "analogia", "dibujo", "oracion"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    throw new Error("No se pudo generar el contenido correctamente.");
  }
};

export const generateColoringImage = async (sceneDescription: string, age: AgeRange): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const isYoung = age === '4-6';
  const isMid = age === '7-9';
  const isOld = age === '10-12';
  
  const styleConstraints = isYoung 
    ? "EXTREMELY SIMPLE, VERY THICK OUTLINES, ROUNDED SHAPES, MINIMAL GROUND LINE."
    : isMid
    ? "CLEAN LINE ART, MEDIUM-THICK OUTLINES, EXPRESSIVE FACES, SUBTLE MOVEMENT (walking, reacting), SIMPLE GROUND DETAILS (path, small rocks)."
    : "DETAILED DYNAMIC LINE ART, NORMAL OUTLINES, NATURAL POSES AND MOVEMENT (turning, walking), ENVIRONMENTAL DEPTH (ground texture, landscape, rocks).";

  const backgroundExclusions = isOld 
    ? "" 
    : "- NO SUN RAYS, NO CLOUDS.\n- NO OVERLY COMPLEX OR CROWDED BACKGROUNDS.";

  const imagePrompt = `COLORING PAGE for children (${age} years old). 
STRICT REQUIREMENTS:
- PURE BLACK AND WHITE LINE ART ONLY.
- NO COLORS, NO GRAYSCALE, NO SHADING, NO GRADIENTS.
- NO FILL COLORS, NO TEXTURES.
- WHITE BACKGROUND ONLY.
- NO TEXT, NO CAPTIONS, NO TITLES, NO WORDS.
- NO SUN RAYS, NO LIGHT EFFECTS, NO CLOUDS, NO FLOWERS, NO SMALL DECORATIVE LINES.
- CALM AND BALANCED COMPOSITION WITH PLENTY OF OPEN SPACE FOR COLORING.
${backgroundExclusions}
- STYLE: ${styleConstraints}
- SUBJECT: ${sceneDescription}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};
