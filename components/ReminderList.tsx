
import React from 'react';

interface ReminderListProps {
  reminders: string[];
}

const ReminderList: React.FC<ReminderListProps> = ({ reminders }) => {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 opacity-70">
        <i className="fas fa-list-check mr-2"></i> Reminders
      </h3>
      {reminders.length === 0 ? (
        <p className="text-xs italic opacity-50">No reminders yet...</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((reminder, idx) => (
            <li key={idx} className="text-sm py-2 px-3 bg-white/5 rounded-lg border border-white/5 flex items-center animate-fadeIn">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
              {reminder}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReminderList;
