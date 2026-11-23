import { useState } from 'react';

interface ManifestInputProps {
  onScan: (json: string) => void;
  isScanning: boolean;
}

export default function ManifestInput({ onScan, isScanning }: ManifestInputProps) {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      onScan(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col w-full h-full pt-8">
      <h1 className="text-5xl md:text-7xl leading-[0.9] font-bold tracking-tighter uppercase mb-8">
        Dependency<br/>Scanner
      </h1>

      <div 
        className={`relative border-t border-black/20 pt-8 transition-all duration-300
          ${isDragging ? 'bg-black/5' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type === 'application/json') handleFile(file);
        }}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-3 text-sm tracking-wider text-black/60 uppercase font-bold">
              <span>{">>>"} PASTE_MANIFEST_OR_DROP_PACKAGE.JSON</span>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='{&#10;  "dependencies": {&#10;    "react": "^18.0.0"&#10;  }&#10;}'
              className="w-full h-64 bg-transparent border border-black/20 p-4 text-base text-black focus:outline-none focus:border-black resize-none transition-colors placeholder:text-black/20 font-mono"
              disabled={isScanning}
            />
          </div>

          <div className="w-full md:w-auto flex flex-col justify-end h-64">
            <button
              onClick={() => onScan(text)}
              disabled={isScanning || !text.trim()}
              className="w-full md:w-64 h-16 bg-black text-white font-bold text-lg uppercase tracking-wider hover:bg-black/80 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isScanning ? 'SCANNING...' : 'INITIALIZE SCAN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}