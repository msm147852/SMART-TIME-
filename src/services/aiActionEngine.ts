import type { AppView, Expense, DailyTask, Note } from '../types';

/**
 * SMART TIME V9 — deterministic action extraction layer.
 *
 * The model/chat layer should only provide natural language. This layer turns
 * recognized intents into typed, reviewable actions before anything is saved.
 * It deliberately does not write to repositories: execution belongs to the
 * application layer so permissions, confirmation and offline queues remain
 * centralized.
 */
export type SmartTimeAction =
  | { type: 'expense.create'; payload: Pick<Expense, 'amount' | 'category' | 'description'> }
  | { type: 'task.create'; payload: Pick<DailyTask, 'title'> }
  | { type: 'note.create'; payload: Pick<Note, 'title' | 'content'> }
  | { type: 'navigate'; payload: { view: AppView } };

export interface ActionParseResult {
  action: SmartTimeAction | null;
  confidence: 'high' | 'medium' | 'low';
  requiresConfirmation: boolean;
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه');

const parseAmount = (text: string): number | null => {
  const match = text.match(/(?:\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const amount = Number(match[0].replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const containsAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

export function parseSmartTimeAction(input: string): ActionParseResult {
  const text = normalize(input);
  if (!text) return { action: null, confidence: 'low', requiresConfirmation: false };

  if (containsAny(text, ['المصاريف', 'المصاريف', 'المصروفات', 'فلوس', 'ميزانيه'])) {
    return {
      action: { type: 'navigate', payload: { view: 'expenses' } },
      confidence: 'high',
      requiresConfirmation: false,
    };
  }

  if (containsAny(text, ['ملاحظه', 'مفكره', 'اكتب ملاحظه', 'سجل ملاحظه'])) {
    const content = input.replace(/^(?:.*?)(?:ملاحظه|مفكره)\s*/i, '').trim() || input.trim();
    return {
      action: {
        type: 'note.create',
        payload: { title: content.slice(0, 48) || 'ملاحظة جديدة', content },
      },
      confidence: content ? 'medium' : 'low',
      requiresConfirmation: true,
    };
  }

  if (containsAny(text, ['ذكرني', 'تذكرني', 'مهمه', 'مهمة', 'اعمل تذكير', 'ضيف مهمه'])) {
    const title = input
      .replace(/(?:ذكرني|تذكرني|مهمه|مهمة|اعمل تذكير|ضيف مهمه)/gi, '')
      .replace(/^\s*(ب|ان|أن)\s*/i, '')
      .trim();
    if (!title) return { action: null, confidence: 'low', requiresConfirmation: false };
    return {
      action: { type: 'task.create', payload: { title } },
      confidence: 'high',
      requiresConfirmation: true,
    };
  }

  if (containsAny(text, ['سجل', 'اضف', 'أضف', 'مصروف', 'دفعت', 'دفعت'])) {
    const amount = parseAmount(text);
    if (amount !== null) {
      let category = 'عام';
      if (containsAny(text, ['بنزين', 'وقود', 'سولار'])) category = 'بنزين';
      else if (containsAny(text, ['اكل', 'طعام', 'مطعم'])) category = 'طعام';
      else if (containsAny(text, ['مواصلات', 'تاكسي', 'اوبر'])) category = 'مواصلات';
      else if (containsAny(text, ['صيان', 'عربيه', 'سياره'])) category = 'سيارة';

      return {
        action: {
          type: 'expense.create',
          payload: {
            amount,
            category,
            description: input.trim().slice(0, 160),
          },
        },
        confidence: category === 'عام' ? 'medium' : 'high',
        requiresConfirmation: true,
      };
    }
  }

  return { action: null, confidence: 'low', requiresConfirmation: false };
}

export function describeAction(action: SmartTimeAction, language: 'ar' | 'en' = 'ar'): string {
  if (language === 'en') {
    switch (action.type) {
      case 'expense.create':
        return `Add expense: ${action.payload.amount} (${action.payload.category})`;
      case 'task.create':
        return `Create task: ${action.payload.title}`;
      case 'note.create':
        return `Create note: ${action.payload.title}`;
      case 'navigate':
        return `Open: ${action.payload.view}`;
    }
  }

  switch (action.type) {
    case 'expense.create':
      return `إضافة مصروف ${action.payload.amount} — ${action.payload.category}`;
    case 'task.create':
      return `إنشاء مهمة: ${action.payload.title}`;
    case 'note.create':
      return `إنشاء ملاحظة: ${action.payload.title}`;
    case 'navigate':
      return `فتح القسم: ${action.payload.view}`;
  }
}
