import React, { useState, useEffect, useRef } from 'react';

const VoiceExercises: React.FC = () => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const exercises = [
    { name: "Ses Isınma", instructions: "A-E-I-O-U seslerini uzatarak söyleyin" },
    { name: "Ses Yükseltme", instructions: "Alçak tondan yüksek tona geçiş yapın" },
    { name: "Rezonans", instructions: "Mmmm sesiyle rezonans çalışması yapın" }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks);
        const audioUrl = URL.createObjectURL(audioBlob);
        visualizeAudio(audioUrl);
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

  const visualizeAudio = async (audioUrl: string) => {
    const audioContext = new AudioContext();
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    setAudioData(audioBuffer.getChannelData(0));
  };

  useEffect(() => {
    if (audioData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#E30A17';

      const sliceWidth = canvas.width / audioData.length;
      let x = 0;

      for (let i = 0; i < audioData.length; i++) {
        const y = (audioData[i] * canvas.height / 2) + canvas.height / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
    }
  }, [audioData]);

  return (
    <div className="exercise-container">
      <h2>Ses Egzersizleri</h2>
      <div className="exercise-content">
        <h3>{exercises[currentExercise].name}</h3>
        <p>{exercises[currentExercise].instructions}</p>
        
        <canvas ref={canvasRef} width="400" height="100" className="audio-visualizer" />
        
        <div className="controls">
          <button onClick={isRecording ? stopRecording : startRecording}>
            {isRecording ? 'Kaydı Durdur' : 'Kayda Başla'}
          </button>
          <button onClick={() => setCurrentExercise((prev) => (prev > 0 ? prev - 1 : exercises.length - 1))}>
            Önceki
          </button>
          <button onClick={() => setCurrentExercise((prev) => (prev + 1) % exercises.length)}>
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceExercises;
