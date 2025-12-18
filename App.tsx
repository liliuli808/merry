
import React, { useState, useCallback } from 'react';
import ChristmasScene from './components/ChristmasScene';
import IntroScreen from './components/IntroScreen';
import UIOverlay from './components/UIOverlay';
import { GestureState } from './types';

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [gesture, setGesture] = useState<GestureState>('IDLE');

  const handleStart = () => {
    setStarted(true);
  };

  const handleGestureChange = useCallback((newGesture: GestureState) => {
    setGesture(newGesture);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {!started ? (
        <IntroScreen onStart={handleStart} />
      ) : (
        <>
          <ChristmasScene gesture={gesture} />
          <UIOverlay gesture={gesture} onGestureDetected={handleGestureChange} />
          
          <div className="absolute top-8 left-0 w-full text-center pointer-events-none z-10">
            <h1 className="text-5xl md:text-7xl font-luxury text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">
              MERRY CHRISTMAS
            </h1>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
