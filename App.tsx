
import React, { useState } from 'react';
import { Heart, BookOpen, Rocket, Paintbrush, Sparkles } from 'lucide-react';
import { AgeRange, GospelOutput } from './types';
import { generateGospelContent, generateColoringImage } from './services/gemini';

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
      setError("¡Oye! Primero pega aquí el Evangelio del domingo 😊");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setColoringImage(null);
    
    try {
      const data = await generateGospelContent(gospelInput, ageRange);
      setResult(data);
      
      // Generate image in background
      setLoadingImage(true);
      try {
        const imageUrl = await generateColoringImage(data.dibujo, ageRange);
        setColoringImage(imageUrl);
      } catch (imgErr) {
        console.error("Error generating coloring image:", imgErr);
      } finally {
        setLoadingImage(false);
      }
    } catch (err) {
      setError("¡Oh no! Hubo un problema en el cielo. ¡Vuelve a intentar! 🙏");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-gray-800 pb-24">
      <main className="max-w-2xl mx-auto px-6 pt-12 space-y-12">
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4 animate-bounce">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
              Evangelio para Peques
            </h1>
            <p className="text-gray-500 font-medium">
              Transforma la Palabra de Dios en una aventura para niños.
            </p>
          </div>

          {/* Input Section */}
          <Card>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-widest ml-1">
                  Pega el Evangelio aquí:
                </label>
                <textarea
                  value={gospelInput}
                  onChange={(e) => setGospelInput(e.target.value)}
                  placeholder="En aquel tiempo, Jesús dijo..."
                  className="w-full h-40 p-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white focus:outline-none text-gray-700 font-medium transition-all resize-none shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-600 uppercase tracking-widest ml-1">
                  Edad del niño:
                </label>
                <div className="flex gap-3">
                  {(['4-6', '7-9', '10-12'] as AgeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setAgeRange(range)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        ageRange === range
                          ? 'bg-yellow-400 text-white shadow-md scale-[1.02]'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-2xl">🕊️</span>
                    Generando...
                  </>
                ) : (
                  <>
                    <span>👉</span> Generar enseñanza
                  </>
                )}
              </button>
              
              {error && (
                <p className="text-red-500 text-center font-bold animate-pulse">
                  {error}
                </p>
              )}
            </div>
          </Card>

          {/* Results Section */}
          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <Card title="Historia / Cuento" icon={<BookOpen size={28} />} className="border-l-8 border-l-blue-400">
                <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {result.historia}
                </div>
              </Card>

              <Card title="Analogía" icon={<Rocket size={28} />} className="border-l-8 border-l-orange-400">
                <div className="text-gray-700 leading-relaxed font-medium italic">
                  "{result.analogia}"
                </div>
              </Card>

              <Card title="Dibujo para colorear" icon={<Paintbrush size={28} />} className="border-l-8 border-l-green-400">
                <div className="relative aspect-square w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                  {loadingImage ? (
                    <div className="flex flex-col items-center gap-3">
                      <Paintbrush className="animate-bounce text-green-400" size={40} />
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Creando tu dibujo...</p>
                    </div>
                  ) : coloringImage ? (
                    <img 
                      src={coloringImage} 
                      alt="Dibujo para colorear" 
                      className="w-full h-full object-contain p-4"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se pudo crear el dibujo</p>
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-400 font-bold uppercase tracking-widest text-center">
                  ¡Imprime esta pantalla o calca el dibujo para colorear!
                </p>
              </Card>

              <Card title="Oración" icon={<Sparkles size={28} />} className="border-l-8 border-l-pink-400 text-center">
                <div className="text-xl font-bold text-gray-800 mb-2">
                  ¡Hablemos con Jesús!
                </div>
                <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {result.oracion}
                </div>
              </Card>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => {
                    setResult(null);
                    setGospelInput('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3 bg-gray-100 text-gray-500 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  🔄 ¡Hacer otro!
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
