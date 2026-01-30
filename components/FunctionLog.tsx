
import React from 'react';
import { ToolCall } from '../types';

interface FunctionLogProps {
  logs: { timestamp: Date; call: ToolCall; result: any }[];
}

const FunctionLog: React.FC<FunctionLogProps> = ({ logs }) => {
  return (
    <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs overflow-hidden flex flex-col h-full max-h-[400px]">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold text-emerald-400 flex items-center">
          <span className="flex space-x-1 mr-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          </span>
          TOOL_EXECUTION_LOG
        </h3>
        <span className="text-[10px] opacity-40 uppercase">System Active</span>
      </div>
      <div className="overflow-y-auto space-y-4 flex-grow scrollbar-hide">
        {logs.length === 0 && (
          <div className="opacity-30 flex flex-col items-center justify-center h-full">
            <i className="fas fa-terminal text-2xl mb-2"></i>
            <p>Awaiting commands...</p>
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="animate-slideUp">
            <div className="text-blue-400 mb-1">
              [{log.timestamp.toLocaleTimeString()}] CALL: <span className="text-white">{log.call.name}</span>
            </div>
            <div className="pl-4 border-l border-white/10 text-slate-400">
              <span className="text-purple-400">args:</span> {JSON.stringify(log.call.args)}
            </div>
            <div className="pl-4 border-l border-white/10 text-emerald-500 mt-1">
              <span className="text-slate-400">result:</span> {JSON.stringify(log.result)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FunctionLog;
