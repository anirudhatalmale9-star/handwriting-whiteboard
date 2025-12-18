import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

export type Tool = 'recognize' | 'normal' | 'eraser';

export interface WhiteboardCanvasHandle {
  clear: () => void;
  getImage: () => string;
  isEmpty: () => boolean;
  getBoundingBox: () => { x: number, y: number, width: number, height: number } | null;
  drawText: (text: string, x: number, y: number, width: number, height: number, color: string) => void;
}

export interface WhiteboardCanvasProps {
  onStrokeEnd?: () => void;
  tool: Tool;
  color: string;
}

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(({ onStrokeEnd, tool, color }, ref) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const boundsRef = useRef({ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  const resetBounds = () => {
    boundsRef.current = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  };

  const updateBounds = (x: number, y: number) => {
    boundsRef.current.minX = Math.min(boundsRef.current.minX, x);
    boundsRef.current.minY = Math.min(boundsRef.current.minY, y);
    boundsRef.current.maxX = Math.max(boundsRef.current.maxX, x);
    boundsRef.current.maxY = Math.max(boundsRef.current.maxY, y);
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      [mainCanvasRef.current, inputCanvasRef.current].forEach(canvas => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
      setHasContent(false);
      resetBounds();
    },
    getImage: () => {
      const canvas = inputCanvasRef.current;
      if (!canvas) return '';
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return '';

      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      return tempCanvas.toDataURL('image/png');
    },
    isEmpty: () => !hasContent,
    getBoundingBox: () => {
      const b = boundsRef.current;
      if (b.minX === Infinity) return null;
      return { x: b.minX, y: b.minY, width: b.maxX - b.minX, height: b.maxY - b.minY };
    },
    drawText: (text: string, x: number, y: number, width: number, height: number, textColor: string) => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear the input canvas (remove strokes)
      const inputCanvas = inputCanvasRef.current;
      if (inputCanvas) {
        const inputCtx = inputCanvas.getContext('2d');
        if (inputCtx) inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
      }

      // Reset bounds for next input
      resetBounds();
      setHasContent(false);

      // Draw text on main canvas
      ctx.save();
      ctx.font = `48px "Monotype Corsiva", "Petit Formal Script", cursive`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Simple text wrapping or scaling could be added here
      // For now, just draw at center of bounds
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      // Handle multi-line text
      const lines = text.split('\n');
      const lineHeight = 50;
      const startY = centerY - ((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, i) => {
        ctx.fillText(line, centerX, startY + i * lineHeight);
      });

      ctx.restore();
    }
  }));

  useEffect(() => {
    const resize = () => {
      [mainCanvasRef.current, inputCanvasRef.current].forEach(canvas => {
        if (!canvas || !canvas.parentElement) return;

        // Create a temporary canvas to save the current content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        // Resize the canvas to fill the parent
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        // Restore the content
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempCanvas, 0, 0);
        }
      });
    };

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, []);

  const getTargetContexts = () => {
    const ctxs = [];
    if (tool === 'recognize') {
      const c = inputCanvasRef.current;
      if (c) ctxs.push(c.getContext('2d'));
    } else if (tool === 'normal') {
      const c = mainCanvasRef.current;
      if (c) ctxs.push(c.getContext('2d'));
    } else if (tool === 'eraser') {
      // Eraser affects both
      if (mainCanvasRef.current) ctxs.push(mainCanvasRef.current.getContext('2d'));
      if (inputCanvasRef.current) ctxs.push(inputCanvasRef.current.getContext('2d'));
    }
    return ctxs;
  };

  const startDrawing = (e: React.PointerEvent) => {
    const ctxs = getTargetContexts();
    if (ctxs.length === 0) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);

    if (tool === 'recognize') {
      setHasContent(true);
      updateBounds(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }

    ctxs.forEach(ctx => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.lineWidth = tool === 'eraser' ? 20 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
    });
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const ctxs = getTargetContexts();

    if (tool === 'recognize') {
      updateBounds(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }

    ctxs.forEach(ctx => {
      if (!ctx) return;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    });
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (isDrawing && onStrokeEnd && tool === 'recognize') {
      onStrokeEnd();
    }
    setIsDrawing(false);

    const ctxs = getTargetContexts();
    ctxs.forEach(ctx => {
      if (ctx) ctx.closePath();
    });

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative w-full h-full touch-none cursor-crosshair">
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <canvas
        ref={inputCanvasRef}
        className="absolute inset-0 w-full h-full"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
      />
    </div>
  );
});
