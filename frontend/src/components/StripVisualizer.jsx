import React, { useRef, useEffect, useState } from 'react';
import { Layers } from 'lucide-react';

export const StripVisualizer = ({ imageSrc, result }) => {
  const canvasRef = useRef(null);
  const [showYolo, setShowYolo] = useState(true);
  const [showSensing, setShowSensing] = useState(true);
  const [showReference, setShowReference] = useState(true);

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Draw Base Image
      ctx.drawImage(img, 0, 0);
      
      if (!result) return;
      
      const testStripBbox = result.test_strip_bbox || result.bbox;
      const refScaleBbox = result.reference_scale_bbox;
      const refPatches = result.measured_reference_patches || [];
      
      // 1. Dynamic YOLO11 TEST STRIP Bounding Box
      if (showYolo && testStripBbox && testStripBbox.length === 4) {
        const [bx, by, bw, bh] = testStripBbox;
        ctx.strokeStyle = '#06b6d4'; // Cyan
        ctx.lineWidth = 4;
        ctx.strokeRect(bx, by, bw, bh);
        
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(bx, Math.max(0, by - 26), 180, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        const conf = result.test_strip_conf || result.confidence || 0.95;
        ctx.fillText(`TEST STRIP ${conf}`, bx + 6, Math.max(16, by - 8));
      }

      // 2. Dynamic YOLO11 REFERENCE SCALE Bounding Box & 6 Sub-Patch Boxes
      if (showReference && refScaleBbox && refScaleBbox.length === 4) {
        const [rx, ry, rw, rh] = refScaleBbox;
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.lineWidth = 4;
        ctx.strokeRect(rx, ry, rw, rh);
        
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(rx, Math.max(0, ry - 26), 210, 26);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        const rconf = result.reference_scale_conf || 0.92;
        ctx.fillText(`REFERENCE SCALE ${rconf}`, rx + 6, Math.max(16, ry - 8));

        // Draw 6 Sub-Patch Boxes inside Reference Scale Box
        if (refPatches && refPatches.length > 0) {
          refPatches.forEach((patch) => {
            if (patch.sub_bbox) {
              const [px, py, pw, ph] = patch.sub_bbox;
              const absX = rx + px;
              const absY = ry + py;
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(absX, absY, pw, ph);
              ctx.setLineDash([]);
              
              // Fill background badge
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.fillRect(absX, absY, Math.min(pw, 85), 14);
              ctx.fillStyle = '#60a5fa';
              ctx.font = 'bold 9px monospace';
              ctx.fillText(patch.stage, absX + 2, absY + 10);
            }
          });
        }
      }

      // 3. Sensing Zone Overlay inside test_strip
      if (showSensing && testStripBbox && testStripBbox.length === 4) {
        const [bx, by, bw, bh] = testStripBbox;
        ctx.strokeStyle = '#f59e0b'; // Amber
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
      }
    };
    
    img.src = imageSrc;
  }, [imageSrc, result, showYolo, showSensing, showReference]);

  return (
    <div className="space-y-3">
      {/* Controls Header */}
      <div className="flex items-center justify-between text-xs font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Interactive Computer Vision Overlays</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-cyan-400">
            <input type="checkbox" checked={showYolo} onChange={e => setShowYolo(e.target.checked)} className="rounded border-slate-700 text-cyan-500" />
            <span className="text-cyan-400 font-bold">YOLO Box</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-400">
            <input type="checkbox" checked={showSensing} onChange={e => setShowSensing(e.target.checked)} className="rounded border-slate-700 text-amber-500" />
            <span className="text-amber-400 font-bold">Sensing Zone</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-400">
            <input type="checkbox" checked={showReference} onChange={e => setShowReference(e.target.checked)} className="rounded border-slate-700 text-blue-500" />
            <span className="text-blue-400 font-bold">Ref Scale</span>
          </label>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2 shadow-2xl">
        <canvas ref={canvasRef} className="max-w-full max-h-[480px] object-contain rounded-lg" />
      </div>
    </div>
  );
};
