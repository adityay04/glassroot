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
      <h1 className="text-4xl sm:text-5xl md:text-7xl leading-[0.9] font-bold tracking-tighter uppercase mb-8">
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
          if (file) handleFile(file);
        }}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-3 text-sm tracking-wider text-black/60 uppercase font-bold">
              <span>{">>>"} PASTE_OR_DROP_MANIFEST_OR_LOCKFILE</span>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Paste package.json, package-lock.json, yarn.lock, or pnpm-lock.yaml'}
              className="w-full h-64 bg-transparent border border-black/20 p-4 text-base text-black focus:outline-none focus:border-black resize-none transition-colors placeholder:text-black/20 font-mono"
              disabled={isScanning}
            />
            <label
              htmlFor="dependency-lockfile"
              className="mt-3 inline-flex cursor-pointer border border-black/30 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
            >
              Choose manifest or lockfile
            </label>
            <input
              id="dependency-lockfile"
              type="file"
              accept=".json,.lock,.yaml,.yml,application/json,text/plain"
              className="sr-only"
              disabled={isScanning}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = '';
              }}
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