import { motion, AnimatePresence } from 'framer-motion';
import { ScanRecord } from '../../core/db/history';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanRecord[];
  onLoad: (record: ScanRecord) => void;
  onClear: () => void;
}

export default function HistoryDrawer({ isOpen, onClose, history, onLoad, onClear }: HistoryDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-md bg-[#f4f4f4] border-r border-black/20 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 sm:p-6 border-b border-black/20 flex justify-between items-center bg-white/50">
              <h2 className="text-xl font-bold uppercase tracking-tighter">Scan_History</h2>
              <button 
                onClick={onClose}
                className="text-xs font-bold uppercase tracking-wider border border-black/20 px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
              >
                [ Close ]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 custom-scrollbar">
              {history.length === 0 ? (
                <p className="text-sm text-black/50 font-medium text-center mt-10">
                  No previous scans found.
                </p>
              ) : (
                history.map((record) => (
                  <div 
                    key={record.id}
                    onClick={() => onLoad(record)}
                    className="border border-black/20 p-4 cursor-pointer hover:bg-white hover:border-black transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg group-hover:underline">{record.projectName}</h3>
                      <span className="text-[10px] font-mono text-black/40 bg-black/5 px-2 py-1">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-black/60 font-mono">
                      {record.results.length} packages analyzed
                    </p>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-black/20 bg-white/50">
                <button 
                  onClick={onClear}
                  className="w-full border border-red-600/30 text-red-600 font-bold text-xs uppercase tracking-wider py-2 hover:bg-red-600 hover:text-white transition-colors"
                >
                  [ Clear_All_Data ]
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}