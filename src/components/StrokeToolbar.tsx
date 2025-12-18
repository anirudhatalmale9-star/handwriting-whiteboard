import { Trash2, ScanText, Zap, ZapOff, PenTool, Pencil, Eraser } from 'lucide-react';
import { Tool } from './WhiteboardCanvas';

interface StrokeToolbarProps {
  onClear: () => void;
  onRecognize: () => void;
  isRecognizing: boolean;
  hasContent: boolean;
  isAutoRecognize: boolean;
  onToggleAutoRecognize: () => void;
  tool: Tool;
  onSetTool: (tool: Tool) => void;
  color: string;
  onSetColor: (color: string) => void;
}

const COLORS = [
  '#000000', // Black
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
];

export function StrokeToolbar({
  onClear,
  onRecognize,
  isRecognizing,
  hasContent,
  isAutoRecognize,
  onToggleAutoRecognize,
  tool,
  onSetTool,
  color,
  onSetColor
}: StrokeToolbarProps) {
  return (
    <div className="flex flex-col gap-2 p-2 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Tools Row */}
      <div className="flex gap-2 items-center justify-center">
        <button
          onClick={() => onSetTool('recognize')}
          className={`p-2 rounded-md transition-colors ${
            tool === 'recognize' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Smart Pen (Auto-Convert)"
        >
          <PenTool size={20} />
        </button>

        <button
          onClick={() => onSetTool('normal')}
          className={`p-2 rounded-md transition-colors ${
            tool === 'normal' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Normal Pen"
        >
          <Pencil size={20} />
        </button>

        <button
          onClick={() => onSetTool('eraser')}
          className={`p-2 rounded-md transition-colors ${
            tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={onToggleAutoRecognize}
          className={`p-2 rounded-md transition-colors ${
            isAutoRecognize ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title={isAutoRecognize ? "Auto-Recognize On" : "Auto-Recognize Off"}
        >
          {isAutoRecognize ? <Zap size={20} /> : <ZapOff size={20} />}
        </button>

        <button
          onClick={onClear}
          className="p-2 hover:bg-gray-100 rounded-md text-gray-700 transition-colors"
          title="Clear All"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Colors Row */}
      <div className="flex gap-2 items-center justify-center pt-1 border-t border-gray-100">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onSetColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              color === c ? 'border-gray-400 scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
