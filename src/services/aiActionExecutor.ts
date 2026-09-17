import type { Note, Expense } from '../types';
import type { SmartTimeAction } from './aiActionEngine';
import { ExpensesRepository, NotesRepository } from './repositories';
import { OfflineActionQueue } from './offlineActionQueue';

export type ActionExecutionResult =
  | { ok: true; type: 'created' | 'navigated'; id?: string; view?: SmartTimeAction extends { type: 'navigate' } ? never : never }
  | { ok: false; error: string };

const makeId = (prefix: string) =>
  `${prefix}_${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;

/**
 * Single application boundary for AI-originated mutations.
 * The parser decides WHAT the user asked for; this module decides HOW the
 * existing repositories are changed. Nothing here calls an AI provider.
 */
export const AiActionExecutor = {
  execute(action: SmartTimeAction): ActionExecutionResult {
    try {
      switch (action.type) {
        case 'expense.create': {
          const now = new Date().toISOString();
          const expense: Expense = {
            id: makeId('ai_expense'),
            title: action.payload.description || 'AI expense',
            amount: action.payload.amount,
            category: action.payload.category,
            date: now.slice(0, 10),
            paymentMethod: 'cash',
            createdAt: now,
          };
          ExpensesRepository.addExpense(expense);
          OfflineActionQueue.enqueue(action);
          return { ok: true, type: 'created', id: expense.id };
        }

        case 'note.create': {
          const now = new Date().toISOString();
          const note: Note = {
            id: makeId('ai_note'),
            title: action.payload.title || 'ملاحظة من AI',
            content: action.payload.content,
            tags: [],
            color: '#8b5cf6',
            isFavorite: false,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
            date: now.slice(0, 10),
          };
          NotesRepository.saveNotes([note, ...NotesRepository.getNotes()]);
          OfflineActionQueue.enqueue(action);
          return { ok: true, type: 'created', id: note.id };
        }

        case 'task.create':
          // Task storage is not yet exposed through a dedicated repository.
          // Keep the action durable until the task repository is introduced.
          OfflineActionQueue.enqueue(action);
          return { ok: true, type: 'created' };

        case 'navigate':
          return { ok: true, type: 'navigated' };
      }
    } catch (error) {
      console.error('[SMART TIME V9] AI action execution failed:', error);
      OfflineActionQueue.enqueue(action);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown execution error' };
    }
  },
};
