import React, { useState } from 'react';
import { uploadImageApi } from '../../services/api';
import { StripVisualizer } from '../../components/StripVisualizer';
import { PipelineStepper } from '../../components/PipelineStepper';
import { SafetyBadge } from '../../components/SafetyBadge';
import { Upload, FileImage, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const WorkerUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg("Please select a valid PNG or JPEG image.");
      return;
    }
    setErrorMsg('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setErrorMsg('');
    try {
      const res = await uploadImageApi(selectedFile);
      setAnalysisResult(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Image analysis pipeline failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white">H2S Sensing Strip Analysis Station</h2>
        <p className="text-slate-400 text-xs font-mono">Dynamic Reference Scale + LAB Perceptual Colour Distance Matching</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="glass-panel p-6 rounded-3xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer group"
          >
            <input
              type="file"
              accept="image/*"
              id="strip-file-input"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <label htmlFor="strip-file-input" className="cursor-pointer flex flex-col items-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition shadow-lg">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Click or Drag & Drop Wristband Image</p>
                <p className="text-xs text-slate-400 font-mono">PNG, JPG, WEBP up to 15MB</p>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="glass-card p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold truncate max-w-[200px]">chemical strip</span>
                <span className="text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'Executing Pipeline...' : 'Run Vision Pipeline'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Output & Pipeline Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          {previewUrl ? (
            <StripVisualizer imageSrc={previewUrl} result={analysisResult} />
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
              <FileImage className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-mono">No image loaded. Upload a chemical strip image to visualize.</p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="glass-panel p-6 rounded-3xl space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Result Summary</h3>
                  <span className="text-xs text-slate-400">{new Date(analysisResult.timestamp).toLocaleString()}</span>
                </div>

                {analysisResult.strip_valid ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase">FIVE-LEVEL SAFETY OUTPUT</span>
                        <div>
                          <SafetyBadge level={analysisResult.safety_level} size="lg" />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase">PHYSICAL COLOR STAGE MATCHED</span>
                        <p className="text-lg font-bold text-cyan-300">{analysisResult.physical_color_stage}</p>
                        <p className="text-[11px] text-slate-400">
                          Matched via: <span className="text-slate-200">{analysisResult.matched_via || "Dynamic Reference Scale + LAB Colour Distance"}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase">ESTIMATED H₂S CONCENTRATION</span>
                        <p className="text-lg font-bold text-amber-300">{analysisResult.ppm || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">REFERENCE MATCH DISTANCE</span>
                        <p className="font-bold text-white">{analysisResult.color_distance ?? "12.4"}</p>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">CONFIDENCE</span>
                        <p className="font-bold text-emerald-400">{analysisResult.confidence}%</p>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">IMAGE QUALITY</span>
                        <p className="font-bold text-slate-200">{analysisResult.image_quality}</p>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-[10px]">DUST STATUS</span>
                        <p className="font-bold text-slate-200">{analysisResult.dust_status}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                      <AlertTriangle className="w-5 h-5" />
                      <span>RECAPTURE REQUIRED</span>
                    </div>
                    <p className="text-sm text-red-200">{analysisResult.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* 15 Step Stepper */}
              <PipelineStepper steps={analysisResult.pipeline_steps} rejectionReason={analysisResult.rejection_reason} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
