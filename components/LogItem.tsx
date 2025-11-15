
import React from 'react';
import { Log, LogStatus } from '../types';

interface LogItemProps {
  log: Log;
}

const LogIcon: React.FC<{ status: LogStatus }> = ({ status }) => {
  switch (status) {
    case LogStatus.PENDING:
      return (
        <div className="w-4 h-4 border-2 border-t-transparent border-sky-400 rounded-full animate-spin"></div>
      );
    case LogStatus.SUCCESS:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case LogStatus.ERROR:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case LogStatus.INFO:
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }
};

export const LogItem: React.FC<LogItemProps> = ({ log }) => {
  return (
    <div className="flex items-start gap-3 p-2 text-sm">
      <div className="flex-shrink-0 mt-0.5">
        <LogIcon status={log.status} />
      </div>
      <p className="text-slate-300">{log.message}</p>
    </div>
  );
};
