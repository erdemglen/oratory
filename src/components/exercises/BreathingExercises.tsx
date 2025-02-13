import React, { useState, useEffect, useRef } from 'react';

const BreathingExercises: React.FC = () => {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = setInterval(() => {
        setTimer(timer => {
          const newTimer = timer + 1;
          if (newTimer % 4 === 0) {
            setCurrentPhase(prev => 
              prev === 'inhale' ? 'hold' : 
              prev === 'hold' ? 'exhale' : 'inhale'
            );
          }
          return newTimer;
        });
        setProgress(prev => (prev + 1) % 100);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(100, 100, 90, 0, (Math.PI * 2 * progress) / 100);
      ctx.strokeStyle = '#E30A17';
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.font = '24px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText(currentPhase, 100, 100);
    }
  }, [progress, currentPhase]);

  return (
    <div className="exercise-container">
      <h2>Nefes Egzersizleri</h2>
      <div className="exercise-content">
        <canvas ref={canvasRef} width="200" height="200" className="breathing-guide" />
        <div className="timer">{timer}s</div>
        <div className="phase-indicator">{currentPhase}</div>
        
        <div className="controls">
          <button onClick={() => setIsActive(!isActive)}>
            {isActive ? "Durdur" : "Başlat"}
          </button>
          <button onClick={() => {
            setTimer(0);
            setProgress(0);
            setCurrentPhase('inhale');
          }}>Sıfırla</button>
        </div>
      </div>
    </div>
  );
};

export default BreathingExercises;
