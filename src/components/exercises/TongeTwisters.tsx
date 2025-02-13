import React, { useState, useRef } from 'react';

const TongeTwisters: React.FC = () => {
  const [currentTwister, setCurrentTwister] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const twisters = [
    "Bir berber bir berbere bre berber beri gel demiş",
    "Şu köşe yaz köşesi, şu köşe kış köşesi",
    "Dal sarkar kartal kalkar, kartal kalkar dal sarkar"
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.onstop = () => {
        if (startTimeRef.current) {
          const duration = (Date.now() - startTimeRef.current) / 1000;
          const wordsInTwister = twisters[currentTwister].split(' ').length;
          setSpeed(Math.round((wordsInTwister / duration) * 60)); // Words per minute
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="exercise-container">
      <h2>Tekerleme Çalışması</h2>
      <div className="exercise-content">
        <div className="twister-text">{twisters[currentTwister]}</div>
        {speed && <div className="speed-display">{speed} kelime/dakika</div>}
        
        <div className="controls">
          <button onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? 'Kaydı Durdur' : 'Kayda Başla'}
          </button>
          <button onClick={() => setCurrentTwister((prev) => (prev > 0 ? prev - 1 : twisters.length - 1))}>
            Önceki
          </button>
          <button onClick={() => setCurrentTwister((prev) => (prev + 1) % twisters.length)}>
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
};

export default TongeTwisters;
