import React, { useRef, useEffect, useState } from 'react';
import { analyzeLiveFrameApi } from '../../services/api';
import { SafetyBadge } from '../../components/SafetyBadge';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

export const WorkerLive = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stabilityMsg, setStabilityMsg] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Camera stream unavailable:", err);
      setErrorMsg("Camera access unavailable. Enable camera permissions to analyze a live strip.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureFrameAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setAnalyzing(true);
    setErrorMsg('');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const base64Img = canvas.toDataURL('image/jpeg', 0.85);
    
    try {
      const res = await analyzeLiveFrameApi(base64Img);
      setLiveResult(res);
      setStabilityMsg(res.temporal_stability || '');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Live frame analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = async (sampleName) => {
    setAnalyzing(true);
    try {
      const imgPath = `/sample_data/images/${sampleName}`;
      const res = await fetch(imgPath);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        const result = await analyzeLiveFrameApi(base64data);
        setLiveResult(result);
        setStabilityMsg(result.temporal_stability || '');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setErrorMsg("Failed loading sample frame.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Live Camera Vision Station</h2>
          <p className="text-slate-400 text-xs font-mono">Real-time Dynamic YOLO11 Object Detection & Temporal Stability Verification</p>
        </div>
        
        <button
          onClick={captureFrameAndAnalyze}
          disabled={analyzing}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Processing Pipeline...' : 'Capture & Analyze Frame'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Stream & Result View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-4 rounded-3xl space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 border-2 border-cyan-500/20 pointer-events-none rounded-2xl flex items-center justify-center">
              <div className="w-72 h-36 border-2 border-dashed border-cyan-400/60 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-mono text-cyan-400/80 bg-slate-950/80 px-2 py-1 rounded">ALIGN STRIP & REF SCALE HERE</span>
              </div>
            </div>

            {stabilityMsg && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-700 backdrop-blur-md p-3 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${stabilityMsg === 'STABLE' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                  <span className="text-white font-semibold">{stabilityMsg}</span>
                </div>
                {liveResult?.measurement_saved && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    SAVED TO HISTORY
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Live Frame Result</span>
            </h3>

            {liveResult ? (
              <div className="space-y-4 text-xs font-mono">
                {liveResult.strip_valid ? (
                  <>
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <span className="text-[10px] text-slate-400">FIVE-LEVEL SAFETY OUTPUT</span>
                      <div>
                        <SafetyBadge level={liveResult.safety_level} size="lg" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">Physical Color Stage:</span>
                        <span className="font-bold text-cyan-300">{liveResult.physical_color_stage}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">Estimated H₂S:</span>
                        <span className="font-bold text-amber-300">{liveResult.ppm || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="font-bold text-emerald-400">{liveResult.confidence}%</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">Image Quality:</span>
                        <span className="font-bold text-slate-200">{liveResult.image_quality}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400">Dust Status:</span>
                        <span className="font-bold text-slate-200">{liveResult.dust_status}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 space-y-2">
                    <p className="font-bold text-sm">DETECTION / QUALITY REJECTION</p>
                    <p className="text-xs text-red-200">{liveResult.rejection_reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Capture frame to perform dynamic YOLO11 object detection
              </div>
            )}
          </div>

          <div className="glass-card p-4 rounded-2xl space-y-3">
            <p className="text-xs font-mono font-bold text-cyan-400">Test with Project Sample Strips:</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button onClick={() => loadSample('strip_stage_1_white.png')} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300">Stage 1: White</button>
              <button onClick={() => loadSample('strip_stage_2_pale_yellow.png')} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300">Stage 2: Pale Yellow</button>
              <button onClick={() => loadSample('strip_stage_3_dark_yellow.png')} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300">Stage 3: Dark Yellow</button>
              <button onClick={() => loadSample('strip_stage_4_light_brown.png')} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300">Stage 4: Light Brown</button>
              <button onClick={() => loadSample('strip_stage_5_dark_brown.png')} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300">Stage 5: Dark Brown</button>
              <button onClick={() => loadSample('strip_stage_6_black.png')} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300">Stage 6: Black</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
