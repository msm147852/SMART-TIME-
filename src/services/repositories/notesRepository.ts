import { Note, NoteFolder, NoteTag, CalculatorHistoryItem } from '../../types';
import { STORAGE_KEYS } from '../storageKeys';
import { StorageAdapter } from '../storageAdapter';
import { DEFAULT_NOTES, DEFAULT_NOTE_FOLDERS, DEFAULT_NOTE_TAGS } from '../seedData';

export class NotesRepository {
  // Notes
  static getNotes(): Note[] {
    return StorageAdapter.getItem<Note[]>(STORAGE_KEYS.NOTES, DEFAULT_NOTES);
  }

  static saveNotes(notes: Note[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.NOTES, notes);
  }

  static addNote(note: Note): Note[] {
    const list = this.getNotes();
    const updated = [note, ...list];
    this.saveNotes(updated);
    return updated;
  }

  static updateNote(note: Note): Note[] {
    const list = this.getNotes();
    const updated = list.map((item) => (item.id === note.id ? note : item));
    this.saveNotes(updated);
    return updated;
  }

  static deleteNote(id: string): Note[] {
    const list = this.getNotes();
    const updated = list.filter((item) => item.id !== id);
    this.saveNotes(updated);
    return updated;
  }

  // Folders & Tags
  static getFolders(): NoteFolder[] {
    return StorageAdapter.getItem<NoteFolder[]>(STORAGE_KEYS.NOTE_FOLDERS, DEFAULT_NOTE_FOLDERS);
  }

  static saveFolders(folders: NoteFolder[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.NOTE_FOLDERS, folders);
  }

  static getTags(): NoteTag[] {
    return StorageAdapter.getItem<NoteTag[]>(STORAGE_KEYS.NOTE_TAGS, DEFAULT_NOTE_TAGS);
  }

  static saveTags(tags: NoteTag[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.NOTE_TAGS, tags);
  }

  // Calculator History
  static getCalculatorHistory(): CalculatorHistoryItem[] {
    return StorageAdapter.getItem<CalculatorHistoryItem[]>(STORAGE_KEYS.CALCULATOR_HISTORY, []);
  }

  static saveCalculatorHistory(history: CalculatorHistoryItem[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.CALCULATOR_HISTORY, history);
  }

  static addCalculatorHistory(item: Omit<CalculatorHistoryItem, 'id' | 'timestamp'>): CalculatorHistoryItem[] {
    const list = this.getCalculatorHistory();
    const newItem: CalculatorHistoryItem = {
      ...item,
      id: 'calc_' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newItem, ...list].slice(0, 100);
    this.saveCalculatorHistory(updated);
    return updated;
  }

  static clearCalculatorHistory(): void {
    StorageAdapter.setItem(STORAGE_KEYS.CALCULATOR_HISTORY, []);
  }
}
