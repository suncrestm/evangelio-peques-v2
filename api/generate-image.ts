import OpenAI from "openai";

export const runtime = "edge";

export default async function handler(req: Request) {
  try {
    const { prompt } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `
Dibujo para colorear infantil estilo Biblia.
Blanco y negro, líneas simples, sin sombras.

${prompt}
      `,
      size: "1024x1024",
    });

    const base64 = result.data[0].b64_json;

    return new Response(
      JSON.stringify({ image: base64 }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("IMAGE ERROR:", error);

    return new Response(
      JSON.stringify({ error: "Error generating image" }),
      { status: 500 }
    );
  }
}
