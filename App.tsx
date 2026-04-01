import React, { useState } from 'react';
import { BookOpen, Rocket, Paintbrush, Sparkles } from 'lucide-react';
import { AgeRange, GospelOutput } from './types';
import { generateGospelContent } from './services/gemini';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = "", title, icon }) => (
  <div className={`bg-white rounded-3xl p-8 shadow-sm border border-gray-100 ${className}`}>
    {title && (
      <div className="flex items-center gap-3 mb-6">
        {icon && <div className="text-yellow-500">{icon}</div>}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

const App: React.FC = () => {
  const [gospelInput, setGospelInput] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRange>('7-9');
  const [result, setResult] = useState<GospelOutput | null>(null);
  const [coloringImage, setColoringImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!gospelInput.trim()) {
      setError("¡Oye! Primero pega aquí el Evangelio 😊");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setColoringImage(null);

    try {
      const data = await generateGospelContent(gospelInput, ageRange);
      setResult(data);

      // 🔥 GENERAR IMAGEN DESDE TU API
      setLoadingImage(true);

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: data.historia
        })
      });

      const imgData = await res.json();

      if (imgData.image) {
        setColoringImage(`data:image/png;base64,${imgData.image}`);
      }

      setLoadingImage(false);

    } catch (err) {
      setError("Hubo un problema. Intenta otra vez 🙏");
      setLoadingImage(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-gray-800 pb-24">
      <main className="max-w-2xl mx-auto px-6 pt-12 space-y-12">

        <div className="text-center">
          <h1 className="text-4xl font-bold">Evangelio para Peques</h1>
          <p className="text-gray-500">Convierte el Evangelio en algo para niños</p>
        </div>

        <Card>
          <textarea
            value={gospelInput}
            onChange={(e) => setGospelInput(e.target.value)}
            placeholder="Pega el Evangelio aquí..."
            className="w-full h-40 p-4 border rounded-xl"
          />

          <div className="flex gap-2 mt-4">
            {(['4-6', '7-9', '10-12'] as AgeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setAgeRange(range)}
                className={`flex-1 py-2 rounded ${
                  ageRange === range ? 'bg-yellow-400' : 'bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            className="w-full mt-4 bg-black text-white py-3 rounded"
          >
            {loading ? "Generando..." : "Generar"}
          </button>

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </Card>

        {result && (
          <>
            <Card title="Historia" icon={<BookOpen />}>
              {result.historia}
            </Card>

            <Card title="Analogía" icon={<Rocket />}>
              {result.analogia}
            </Card>

            <Card title="Dibujo" icon={<Paintbrush />}>
              {loadingImage ? (
                <p>Creando dibujo...</p>
              ) : coloringImage ? (
                <>
                  <img src={coloringImage} />

                  {/* BOTÓN DESCARGAR */}
                  <a
                    href={coloringImage}
                    download="dibujo.png"
                    className="block mt-4 bg-black text-white py-2 text-center rounded"
                  >
                    Descargar dibujo
                  </a>
                </>
              ) : (
                <p>No se pudo crear el dibujo</p>
              )}
            </Card>

            <Card title="Oración" icon={<Sparkles />}>
              {result.oracion}
            </Card>
          </>
        )}

      </main>
    </div>
  );
};

export default App;
