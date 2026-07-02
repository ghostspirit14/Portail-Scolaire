import React, { useRef, useState, useEffect } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (value: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(!!value);

  // Initialize canvas with correct size and styles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      // Set buffer size to match display size
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Set line style (smooth blue ink look)
      ctx.strokeStyle = '#1e40af'; // Blue-800
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Re-draw value if present
      if (value) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = value;
        setHasSigned(true);
      }
    };

    // Delay a bit to ensure the container is fully mounted and styled
    const timer = setTimeout(initCanvas, 100);

    // Re-init on window resize
    window.addEventListener('resize', initCanvas);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', initCanvas);
    };
  }, [value]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support client coordinates relative to canvas bounding box
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    save();
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty before saving
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    onChange('');
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2 w-full max-w-md">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
          Signature numérique des parents
          {hasSigned && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />}
        </label>
        {hasSigned && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        )}
      </div>
      
      <div className="relative border border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden h-36 flex flex-col justify-center items-center shadow-inner group">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
        
        {!hasSigned && (
          <div className="text-slate-400 text-center pointer-events-none select-none flex flex-col items-center gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Signez ici avec votre souris ou doigt</span>
            <span className="text-[9px] text-slate-400">Le dessin est enregistré et sera imprimé directement sur le PDF</span>
          </div>
        )}
      </div>
    </div>
  );
};
