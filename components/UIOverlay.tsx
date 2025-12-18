
import React, { useEffect, useRef, useState } from 'react';
import * as HandsModule from '@mediapipe/hands';
import * as CameraModule from '@mediapipe/camera_utils';
import * as DrawingModule from '@mediapipe/drawing_utils';
import { GestureState } from '../types';

const getExport = (mod: any, name: string) => {
  if (!mod) return undefined;
  if (mod[name]) return mod[name];
  if (mod.default && mod.default[name]) return mod.default[name];
  if (mod.default && mod.default.prototype && mod.default.name === name) return mod.default;
  return (window as any)[name];
};

interface UIOverlayProps {
  gesture: GestureState;
  onGestureDetected: (gesture: GestureState) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gesture, onGestureDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const Hands = getExport(HandsModule, 'Hands');
    const Camera = getExport(CameraModule, 'Camera');
    const HAND_CONNECTIONS = getExport(HandsModule, 'HAND_CONNECTIONS');
    const drawConnectors = getExport(DrawingModule, 'drawConnectors');
    const drawLandmarks = getExport(DrawingModule, 'drawLandmarks');

    if (!Hands || !Camera) {
      setCameraError('MediaPipe library failed to load.');
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults((results: any) => {
      const canvasCtx = canvasRef.current?.getContext('2d');
      if (!canvasCtx || !canvasRef.current) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          if (drawConnectors && HAND_CONNECTIONS) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
              color: '#FFFFFF',
              lineWidth: 2,
            });
          }
          if (drawLandmarks) {
            drawLandmarks(canvasCtx, landmarks, { color: '#FFD700', lineWidth: 1, radius: 2 });
          }
          
          const wrist = landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const ringTip = landmarks[16];
          const pinkyTip = landmarks[20];

          const getDist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
          const avgDistFromWrist = (
            getDist(thumbTip, wrist) +
            getDist(indexTip, wrist) +
            getDist(middleTip, wrist) +
            getDist(ringTip, wrist) +
            getDist(pinkyTip, wrist)
          ) / 5;

          if (avgDistFromWrist < 0.12) {
            onGestureDetected('TREE');
          } else if (avgDistFromWrist > 0.28) {
            onGestureDetected('EXPLODE');
          } else {
            onGestureDetected('IDLE');
          }
        }
      } else {
        onGestureDetected('IDLE');
      }
      canvasCtx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            await hands.send({ image: videoRef.current });
          } catch (e) {
            // Ignore frame errors
          }
        }
      },
      width: 640,
      height: 480,
    });
    cameraRef.current = camera;

    const startCamera = async (retries = 2) => {
      try {
        // Clear any existing stream before starting
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
          videoRef.current.srcObject = null;
        }

        await camera.start();
        setCameraActive(true);
        setCameraError(null);
      } catch (err: any) {
        console.error("Camera attempt failed:", err);
        if (retries > 0) {
          setTimeout(() => startCamera(retries - 1), 1000);
        } else {
          setCameraActive(false);
          setCameraError(err.name === 'NotReadableError' 
            ? "Camera is locked. Please close other apps using it." 
            : "Could not start camera feed.");
        }
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      camera.stop();
      hands.close();
    };
  }, [onGestureDetected]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute bottom-8 left-8 w-48 h-36 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden shadow-2xl flex flex-col pointer-events-auto">
        <div className="h-6 px-2 flex items-center justify-between border-b border-white/10">
          <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">Monitor</span>
          <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <div className="relative flex-1 bg-black/40 flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-3 text-center">
              <p className="text-[10px] text-red-400 font-bold uppercase mb-1 leading-tight">{cameraError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-[8px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition-colors"
              >
                RETRY
              </button>
            </div>
          ) : !cameraActive ? (
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 border-2 border-yellow-500/50 border-t-yellow-500 rounded-full animate-spin mb-2" />
              <span className="text-[9px] text-yellow-500/70 font-mono tracking-widest animate-pulse">CONNECTING...</span>
            </div>
          ) : null}
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className={`w-full h-full scale-x-[-1] transition-opacity duration-700 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
      </div>

      <div className="absolute bottom-48 left-8 flex flex-col space-y-4 pointer-events-auto">
        <div className="flex items-center space-x-3 group">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            gesture === 'EXPLODE' 
              ? 'bg-red-600/40 border-red-400 scale-125 shadow-[0_0_25px_rgba(239,68,68,0.9)]' 
              : 'bg-black/40 border-white/10'
          }`}>
             <div className={`w-3 h-3 rounded-full ${gesture === 'EXPLODE' ? 'bg-red-400 animate-ping' : 'bg-white/10'}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold tracking-widest transition-all duration-300 ${gesture === 'EXPLODE' ? 'text-red-400 translate-x-1' : 'text-white/20'}`}>EXPLODE</span>
            {gesture === 'EXPLODE' && <span className="text-[8px] text-red-400/60 font-mono tracking-tighter">NEBULA ACTIVE</span>}
          </div>
        </div>

        <div className="flex items-center space-x-3 group">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            gesture === 'TREE' 
              ? 'bg-yellow-600/40 border-yellow-400 scale-150 shadow-[0_0_30px_rgba(234,179,8,1)]' 
              : 'bg-black/40 border-white/10'
          }`}>
             <div className={`w-3 h-3 rounded-full ${gesture === 'TREE' ? 'bg-yellow-400 animate-ping' : 'bg-white/10'}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-bold tracking-widest transition-all duration-300 ${gesture === 'TREE' ? 'text-yellow-400 font-black translate-x-2' : 'text-white/20'}`}>TREE</span>
            {gesture === 'TREE' && <span className="text-[8px] text-yellow-400/60 font-mono tracking-tighter">GROWING TREE</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
