import React from 'react';
import { ApiConnectionLog } from '../types';

interface ApiConnectionLogViewerProps {
  logs: ApiConnectionLog[];
}

const ApiConnectionLogViewer: React.FC<ApiConnectionLogViewerProps> = ({ logs }) => {
  return (
    <>
      {logs.length === 0 ? (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-center text-slate-500">
            <p>No external API connections have been logged yet.</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 max-h-[70vh] overflow-y-auto">
            <ul className="space-y-3">
            {logs.map(log => (
                <li key={log.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 flex-shrink-0 font-bold text-lg ${log.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
                    {log.status === 'Success' ? '✓' : '✗'}
                </span>
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-300 truncate" title={log.origin}>{log.origin}</span>
                        <span className="text-slate-500 flex-shrink-0 ml-2">{log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 truncate" title={log.reason}>{log.reason}</p>
                </div>
                </li>
            ))}
            </ul>
        </div>
      )}
    </>
  );
};

export default ApiConnectionLogViewer;
