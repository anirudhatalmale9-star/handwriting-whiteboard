import { useRef, useState, useEffect } from 'react';
import { WhiteboardCanvas, WhiteboardCanvasHandle, Tool } from './components/WhiteboardCanvas';
import { StrokeToolbar } from './components/StrokeToolbar';
import { useHandwritingRecognition } from './hooks/useHandwritingRecognition';

function App() {
  const canvasRef = useRef<WhiteboardCanvasHandle>(null);
  const { recognize, isRecognizing, error } = useHandwritingRecognition();
  const [hasContent, setHasContent] = useState(false);
  const [isAutoRecognize, setIsAutoRecognize] = useState(true);
  const [autoTimerActive, setAutoTimerActive] = useState(false);
  const [tool, setTool] = useState<Tool>('recognize');
  const [color, setColor] = useState('#000000');
  const autoRecognizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClear = () => {
    canvasRef.current?.clear();
    setHasContent(false);
    if (autoRecognizeTimeoutRef.current) {
      clearTimeout(autoRecognizeTimeoutRef.current);
    }
    setAutoTimerActive(false);
  };

  const handleRecognize = async () => {
    const image = canvasRef.current?.getImage();
    const bounds = canvasRef.current?.getBoundingBox();

    if (image && bounds) {
      setAutoTimerActive(false);
      const text = await recognize(image);

      if (text) {
        canvasRef.current?.drawText(text, bounds.x, bounds.y, bounds.width, bounds.height, color);
      }
    }
  };

  const checkContent = () => {
    if (canvasRef.current) {
      setHasContent(!canvasRef.current.isEmpty());
    }
  };

  const handleStrokeEnd = () => {
    checkContent();
    if (isAutoRecognize && tool === 'recognize') {
      if (autoRecognizeTimeoutRef.current) {
        clearTimeout(autoRecognizeTimeoutRef.current);
      }
      setAutoTimerActive(true);
      autoRecognizeTimeoutRef.current = setTimeout(() => {
        handleRecognize();
      }, 1500); // 1.5 seconds delay
    }
  };

  const handleToggleAutoRecognize = () => {
    const newState = !isAutoRecognize;
    setIsAutoRecognize(newState);
    if (autoRecognizeTimeoutRef.current) {
      clearTimeout(autoRecognizeTimeoutRef.current);
    }
    setAutoTimerActive(false);
  };

  useEffect(() => {
    return () => {
      if (autoRecognizeTimeoutRef.current) {
        clearTimeout(autoRecognizeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="fixed inset-0 w-full h-full bg-white overflow-hidden touch-none">
      <div className="absolute inset-0 w-full h-full">
        {/* Canvas Layer */}
        <div className="absolute inset-0 z-10">
          <WhiteboardCanvas
            ref={canvasRef}
            onStrokeEnd={handleStrokeEnd}
            tool={tool}
            color={color}
          />

          {/* Auto-Recognize Status Indicator */}
          {autoTimerActive && !isRecognizing && (
            <div className="absolute top-4 right-4 z-30 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse flex items-center gap-2 pointer-events-none">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              Auto-converting...
            </div>
          )}

          {/* Loading Indicator */}
          {isRecognizing && (
            <div className="absolute top-4 right-4 z-30 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 pointer-events-none">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Recognizing...
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
        <StrokeToolbar
          onClear={handleClear}
          onRecognize={handleRecognize}
          isRecognizing={isRecognizing}
          hasContent={hasContent}
          isAutoRecognize={isAutoRecognize}
          onToggleAutoRecognize={handleToggleAutoRecognize}
          tool={tool}
          onSetTool={setTool}
          color={color}
          onSetColor={setColor}
        />
      </div>
    </main>
  );
}

export default App;
