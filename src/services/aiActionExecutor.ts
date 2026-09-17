import type { AppView, Note, Expense, DailyTask } from '../types';
import type { SmartTimeAction } from './aiActionEngine';
import { ExpensesRepository, NotesRepository } from './repositories';
import { OfflineActionQueue } from './offlineActionQueue';

export type ActionExecutionResult =
  | { ok: true; type: 'created'; id?: string }
  | { ok: true; type: 'navigated'; view: AppView }
  | { ok: false; error: string };

const makeId = (prefix: string) => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;

const createTask = (title: string): DailyTask => ({
  id: makeId('ai_task'), title, completed: false, priority: 'medium', category: 'general', createdAt: new Date().toISOString(),
});

/** Single application boundary for AI-originated mutations. */
export const AiActionExecutor = {
  execute(action: SmartTimeAction): ActionExecutionResult {
    try {
      switch (action.type) {
        case 'expense.create': {
          const now = new Date().toISOString();
          const expense: Expense = { id: makeId('ai_expense'), title: action.payload.description || 'AI expense', amount: action.payload.amount, category: action.payload.category, date: now.slice(0, 10), paymentMethod: 'cash', createdAt: now };
          ExpensesRepository.addExpense(expense);
          OfflineActionQueue.enqueue(action);
          return { ok: true, type: 'created', id: expense.id };
        }
        case 'note.create': {
          const now = new Date().toISOString();
          const note: Note = { id: makeId('ai_note'), title: action.payload.title || 'ملاحظة من AI', content: action.payload.content, tags: [], color: '#8b5cf6', isFavorite: false, isArchived: false, createdAt: now, updatedAt: now, date: now.slice(0, 10) };
          NotesRepository.saveNotes([note, ...NotesRepository.getNotes()]);
          OfflineActionQueue.enqueue(action);
          return { ok: true, type: 'created', id: note.id };
        }
        case 'task.create': {
          const task = createTask(action.payload.title);
          NotesRepository.saveDailyTasks([task, ...NotesRepository.getDailyTasks()]);
          OfflineActionQueue.enqueue(action);
          return { ok: true, type: 'created', id: task.id };
        }
        case 'navigate': return { ok: true, type: 'navigated', view: action.payload.view };
      }
    } catch (error) {
      console.error('[SMART TIME V9] AI action execution failed:', error);
      OfflineActionQueue.enqueue(action);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown execution error' };
    }
  },
};
