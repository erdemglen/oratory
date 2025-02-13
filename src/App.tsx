import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, RefreshCw, BookOpen, Volume2 } from 'lucide-react';

interface SpeechError {
  text: string;
  type: 'pronunciation' | 'emphasis' | 'grammar' | 'dialect' | 'rhythm';
  timestamp: number;
}

// İstanbul Türkçesi için yaygın şive/ağız hataları
const dialectPatterns = [
  { pattern: /geliy(o|e)m/i, correct: "geliyorum" },
  { pattern: /yapıy(o|e)m/i, correct: "yapıyorum" },
  { pattern: /gidiy(o|e)m/i, correct: "gidiyorum" },
  { pattern: /\b[a-zğüşıöç]+caz\b/i, correct: "ğız/eceğiz" }, // yapıcaz -> yapacağız
  { pattern: /\bnaber\b/i, correct: "nasılsın" },
  { pattern: /\bhadi\b/i, correct: "haydi" },
  { pattern: /\bkıral\b/i, correct: "kral" },
  { pattern: /\btıren\b/i, correct: "tren" },
  { pattern: /\bilazım\b/i, correct: "lazım" },
  { pattern: /\bbuğün\b/i, correct: "bugün" },
  { pattern: /\bheralde\b/i, correct: "herhalde" },
  { pattern: /\byalnış\b/i, correct: "yanlış" },
];

// Yaygın dilbilgisi hataları
const grammarPatterns = [
  { pattern: /de ki/i, correct: "deki" }, // birleşik yazılması gereken -ki
  { pattern: /\bşey\b/i, warning: "Daha spesifik bir kelime kullanmayı deneyin" },
  { pattern: /yalnız ki/i, correct: "yalnızki" },
  { pattern: /her hangi/i, correct: "herhangi" },
  { pattern: /bir kaç/i, correct: "birkaç" },
  { pattern: /hiç bir/i, correct: "hiçbir" },
  { pattern: /öyle ki/i, correct: "öyleki" },
  { pattern: /\bki\b/i, warning: "Bağlaç olan 'ki' cümleden çıkarılabilir" },
];

const sampleTexts = [
  {
    title: "Bahar Sabahı",
    content: `Sabah erkenden uyandım. Pencereyi açtığımda içeriye taze bir bahar havası doldu! Kuşların cıvıltısı, çiçeklerin kokusu beni büyüledi.

Vurgulanacak kelimeler: "erkenden", "taze", "bahar", "büyüledi"
Duraklamalar: Noktalama işaretlerinde ve vurgulu kelimelerin öncesinde.`
  },
  {
    title: "Deniz Kenarında",
    content: `Dalgaların sesi kulağıma geliyordu. Martılar gökyüzünde süzülürken, sahilde yürüyen insanları izledim. Denizin kokusu içimi ferahlattı.

Vurgulanacak kelimeler: "dalgaların", "süzülürken", "ferahlattı"
Duraklamalar: Virgüllerde kısa, noktalarda uzun duraklar yapın.`
  },
  {
    title: "Sonbahar Akşamı",
    content: `Rüzgar yaprakları dans ettiriyordu. Gökyüzü turuncu ve mor renklere büründü. Akşamın serinliği yavaş yavaş kendini hissettirmeye başladı.

Vurgulanacak kelimeler: "dans", "turuncu", "serinliği", "hissettirmeye"
Duraklamalar: Her cümle sonunda ve vurgulu kelimelerden önce.`
  },
  {
    title: "Yağmurlu Bir Gün",
    content: `Yağmur damlaları pencereme vuruyor, rüzgar ağaçları sallıyordu. Sokakta şemsiyeli insanlar telaşla yürüyor, arabalar su birikintilerinden geçerken sıçrayan damlalar kaldırımdakileri ıslatıyordu.

Vurgulanacak kelimeler: "vuruyor", "telaşla", "sıçrayan", "ıslatıyordu"
Duraklamalar: Virgüllerde ve cümle sonlarında yapılacak.`
  },
  {
    title: "Kış Gecesi",
    content: `Kar taneleri sessizce yağarken, sıcacık evimde pencereden dışarıyı seyrediyordum. Sokak lambaları karın beyazlığında daha bir parlak görünüyordu. Uzaktan gelen çocuk sesleri kış gecesine ayrı bir neşe katıyordu.

Vurgulanacak kelimeler: "sessizce", "sıcacık", "parlak", "neşe"
Duraklamalar: Noktalama işaretlerinde ve vurgulu kelimelerin öncesinde.`
  }
];

// Diksiyon egzersizleri
const dictionExercises = [
  {
    title: "Tekerlemeler",
    exercises: [
      "Bir berber bir berbere gel beraber bir berber dükkânı açalım demiş.",
      "Şu köşe yaz köşesi, şu köşe kış köşesi, ortada su şişesi.",
      "Dal sarkar kartal kalkar, kartal kalkar dal sarkar.",
      "O pikap, şu pikap, bu pikap.",
      "Üç tunç tas has hoşaf.",
      "Kırk küp, kırkının da kulpu kırık küp.",
      "Bu yoğurdu sarımsaklasak da mı saklasak, sarımsaklamasak da mı saklasak?",
      "Çatalca'da topal çoban çatal yapıp çatal satar, nesi için çatal yapıp çatal satar?",
      "Al bu takatukaları takatukacıya takatukalatmaya götür. Takatukacı takatukaları takatukalatamazsa takatukaları takatukalatmadan geri getir."
    ]
  },
  {
    title: "Nefes Egzersizleri",
    exercises: [
      "Derin nefes alın ve 'a' sesini 10 saniye tutun.",
      "Mum üfleme egzersizi: Hayali bir mumu 5 metre öteden söndürmeye çalışın.",
      "Diyafram nefesi: Elinizi karnınıza koyun ve nefes alırken karnınızın şişmesini hissedin.",
      "Balon şişirme: Derin nefes alıp, yavaşça hayali bir balonu şişirir gibi nefesinizi verin.",
      "Kitap okuma: Bir kitabı açın ve tek nefeste bir paragraf okumaya çalışın.",
      "Merdiven nefesi: Nefes alırken 4'e kadar sayın, tutarken 4'e kadar sayın, verirken 8'e kadar sayın."
    ]
  },
  {
    title: "Ses Egzersizleri",
    exercises: [
      "A-E-I-İ-O-Ö-U-Ü seslerini sırayla, uzatarak söyleyin.",
      "Fısıltıyla başlayıp giderek yükselen bir sesle konuşun.",
      "Aynı cümleyi farklı duygularla (mutlu, üzgün, kızgın, heyecanlı) söyleyin.",
      "Dudaklarınızı büzerek 'R' sesi çıkarın ve bunu 5 saniye tutun.",
      "Dilinizi damağınıza değdirerek 'L' sesini çıkarın ve tutun.",
      "'M' sesi ile mırıldanma egzersizi yapın."
    ]
  },
  {
    title: "Artikülasyon Çalışmaları",
    exercises: [
      "A-DA, E-DE, I-DI, İ-Dİ, O-DO, Ö-DÖ, U-DU, Ü-DÜ hecelerini tekrarlayın.",
      "PA-TA-KA seslerini hızlıca ve ritmik şekilde tekrarlayın.",
      "MA-ME-MI-Mİ-MO-MÖ-MU-MÜ hecelerini sırayla söyleyin.",
      "ZA-ZE-ZI-Zİ-ZO-ZÖ-ZU-ZÜ seslerini net çıkarmaya çalışın.",
      "RA-RE-RI-Rİ-RO-RÖ-RU-RÜ hecelerini vurgulu söyleyin.",
      "Dudaklarınızı büzerek B-P-M seslerini tekrarlayın."
    ]
  }
];

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [text, setText] = useState(sampleTexts[0].content);
  const [recordedText, setRecordedText] = useState('');
  const [errors, setErrors] = useState<SpeechError[]>([]);
  const [showExercises, setShowExercises] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastAnalysisRef = useRef<string>('');

  const changeText = () => {
    const nextIndex = (currentTextIndex + 1) % sampleTexts.length;
    setCurrentTextIndex(nextIndex);
    setText(sampleTexts[nextIndex].content);
    setErrors([]);
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Tarayıcınız konuşma tanımayı desteklemiyor.');
      return;
    }

    // @ts-ignore - Web Speech API TypeScript desteği için
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'tr-TR';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          analyzeText(transcript);
        }
      }
      setRecordedText(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Konuşma tanıma hatası:', event.error);
    };

    recognitionRef.current = recognition;
  }, []);

  const analyzeText = (spokenText: string) => {
    if (lastAnalysisRef.current === spokenText) return;
    lastAnalysisRef.current = spokenText;

    const newErrors: SpeechError[] = [];
    
    // Şive ve ağız kontrolü
    dialectPatterns.forEach(({ pattern, correct }) => {
      if (pattern.test(spokenText)) {
        newErrors.push({
          text: `Şive tespit edildi: "${pattern.source}" yerine "${correct}" kullanın.`,
          type: 'dialect',
          timestamp: Date.now()
        });
      }
    });

    // Dilbilgisi kontrolü
    grammarPatterns.forEach(({ pattern, correct, warning }) => {
      if (pattern.test(spokenText)) {
        newErrors.push({
          text: warning || `Dilbilgisi hatası: "${pattern.source}" yerine "${correct}" kullanın.`,
          type: 'grammar',
          timestamp: Date.now()
        });
      }
    });
    
    // Konuşma hızı kontrolü
    const wordsPerMinute = calculateWordsPerMinute(spokenText);
    if (wordsPerMinute > 180) {
      newErrors.push({
        text: 'Konuşma hızınız çok yüksek. Daha yavaş ve tane tane konuşmayı deneyin.',
        type: 'rhythm',
        timestamp: Date.now()
      });
    } else if (wordsPerMinute < 100) {
      newErrors.push({
        text: 'Konuşma hızınız çok düşük. Biraz daha akıcı konuşmayı deneyin.',
        type: 'rhythm',
        timestamp: Date.now()
      });
    }

    // Vurgulu kelimeler kontrolü
    const emphasisWords = sampleTexts[currentTextIndex].content
      .match(/"([^"]+)"/g)
      ?.map(word => word.replace(/"/g, '')) || [];
    
    const spokenWords = spokenText.toLowerCase().split(' ');
    emphasisWords.forEach(word => {
      if (!spokenWords.includes(word.toLowerCase())) {
        newErrors.push({
          text: `"${word}" kelimesi eksik veya farklı telaffuz edildi`,
          type: 'pronunciation',
          timestamp: Date.now()
        });
      }
    });

    // Duraklamalar kontrolü
    const hasPauses = /[,.!?]/.test(spokenText);
    if (!hasPauses) {
      newErrors.push({
        text: 'Konuşmanızda yeterli durak bulunmuyor. Noktalama işaretlerinde duraklamayı unutmayın.',
        type: 'rhythm',
        timestamp: Date.now()
      });
    }

    // Vurgu ve tonlama kontrolü
    const hasEmphasis = analyzeEmphasis(spokenText);
    if (!hasEmphasis) {
      newErrors.push({
        text: 'Konuşmanızda yeterli vurgu ve tonlama yok. Önemli kelimeleri vurgulayarak okuyun.',
        type: 'emphasis',
        timestamp: Date.now()
      });
    }

    setErrors(prev => [...prev, ...newErrors]);
  };

  const calculateWordsPerMinute = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    const minutes = 1;
    return words / minutes;
  };

  const analyzeEmphasis = (text: string): boolean => {
    const emphasisPatterns = [
      /!/,
      /\?/,
      /[A-ZĞÜŞİÖÇ]+/,
      /[,.;:]/
    ];

    return emphasisPatterns.some(pattern => pattern.test(text));
  };

  const startRecording = () => {
    setIsRecording(true);
    setErrors([]);
    recognitionRef.current?.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">
          Diksiyon ve Konuşma Eğitimi
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Orijinal Metin */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-700">
                {sampleTexts[currentTextIndex].title}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExercises(!showExercises)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Egzersizler
                </button>
                <button
                  onClick={changeText}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Metni Değiştir
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Okumak istediğiniz metni buraya yazın..."
              />
              <div className="text-sm text-gray-600">
                <p className="font-semibold">Okuma Yönergeleri:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Vurgulu kelimeleri daha belirgin telaffuz edin</li>
                  <li>Noktalama işaretlerinde kısa duraklar yapın</li>
                  <li>Doğal bir konuşma hızı ve ritmi kullanın</li>
                  <li>Ses tonunuzu cümlenin anlamına göre ayarlayın</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Kayıt ve Analiz */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              Konuşma Kaydı
            </h2>
            <div className="mb-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Kaydı Durdur
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Kayda Başla
                  </>
                )}
              </button>
            </div>
            <div className="h-48 p-4 border rounded-lg overflow-y-auto bg-gray-50">
              {recordedText || 'Konuşmanız burada görünecek...'}
            </div>
          </div>
        </div>

        {/* Hatalar ve Öneriler */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Geri Bildirim ve Öneriler
          </h2>
          {errors.length > 0 ? (
            <ul className="space-y-2">
              {errors.map((error, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>{error.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">
              Henüz geri bildirim yok. Konuşmaya başlayın...
            </p>
          )}
        </div>

        {/* Diksiyon Egzersizleri */}
        {showExercises && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center gap-2">
              <Volume2 className="w-6 h-6" />
              Diksiyon Egzersizleri
            </h2>
            <div className="space-y-6">
              {dictionExercises.map((category, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-lg font-medium text-blue-600">
                    {category.title}
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {category.exercises.map((exercise, i) => (
                      <li key={i} className="text-gray-700">{exercise}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;