
import React from 'react';

interface IntroScreenProps {
  onStart: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-7xl md:text-9xl font-luxury text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 drop-shadow-2xl">
          MERRY<br/>CHRISTMAS
        </h1>
        <p className="text-yellow-500/60 font-serif tracking-[0.5em] text-sm md:text-lg">
          AN INTERACTIVE LUXURY EXPERIENCE
        </p>
      </div>

      <button
        onClick={onStart}
        className="px-12 py-4 bg-red-700 hover:bg-red-600 text-white rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-110 shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-500/30"
      >
        START
      </button>

      <div className="absolute bottom-10 text-white/30 text-xs text-center max-w-md px-4 leading-relaxed">
        Use your hand to control the particles.<br/>
        Open hand to explode • Close fist to grow the Christmas tree
      </div>
    </div>
  );
};

export default IntroScreen;
