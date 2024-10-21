import React, { useState, useEffect } from 'react';
import './TradeProgress.css';

const TradeProgress = ({ duration, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(parseInt(duration));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
        setProgress((prevProgress) => prevProgress + (100 / parseInt(duration)));
      }, 1000);

      return () => clearInterval(timer);
    } else {
      onComplete();
    }
  }, [timeLeft, duration, onComplete]);

  return (
    <div className="trade-progress">
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      <div className="time-left">{timeLeft}s</div>
    </div>
  );
};

export default TradeProgress;