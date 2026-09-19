import React from 'react';
import type { SmartTimeAction } from '../services/aiActionEngine';
import { describeAction } from '../services/aiActionEngine';

interface Props {
  action: SmartTimeAction | null;
  language: 'ar' | 'en' | 'fr';
  onConfirm: () => void;
  onCancel: () => void;
}

export const AiActionConfirmation: React.FC<Props> = ({ action, language, onConfirm, onCancel }) => {
  if (!action) return null;
  const title = language === 'ar' ? 'تأكيد تنفيذ الأمر' : 'Confirm action';
  const confirm = language === 'ar' ? 'تنفيذ' : 'Confirm';
  const cancel = language === 'ar' ? 'إلغاء' : 'Cancel';
  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 p-4 shadow-lg" role="dialog" aria-label={title}>
      <div className="text-sm font-bold text-slate-900 dark:text-white">{title}</div>
      <div className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">{describeAction(action, language)}</div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">{confirm}</button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300">{cancel}</button>
      </div>
    </div>
  );
};
