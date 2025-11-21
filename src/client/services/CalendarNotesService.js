// Calendar Notes Service - Manages calendar notes with localStorage persistence
class CalendarNotesService {
  constructor() {
    this.storageKey = 'calendar_notes';
    this.notes = this.loadNotes();
  }

  // Load notes from localStorage
  loadNotes() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading calendar notes:', error);
      return {};
    }
  }

  // Save notes to localStorage
  saveNotes() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
    } catch (error) {
      console.error('Error saving calendar notes:', error);
    }
  }

  // Get date key for storage
  getDateKey(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Add or update note for a specific date
  addNote(date, note) {
    const dateKey = this.getDateKey(date);
    if (!this.notes[dateKey]) {
      this.notes[dateKey] = [];
    }
    
    const noteWithId = {
      id: Date.now() + Math.random(),
      type: note.type || 'info',
      description: note.description || '',
      createdAt: new Date().toISOString(),
      ...note
    };
    
    this.notes[dateKey].push(noteWithId);
    this.saveNotes();
    return noteWithId;
  }

  // Get notes for a specific date
  getNotesForDate(date) {
    const dateKey = this.getDateKey(date);
    return this.notes[dateKey] || [];
  }

  // Update a note
  updateNote(date, noteId, updates) {
    const dateKey = this.getDateKey(date);
    if (this.notes[dateKey]) {
      const noteIndex = this.notes[dateKey].findIndex(note => note.id === noteId);
      if (noteIndex !== -1) {
        this.notes[dateKey][noteIndex] = {
          ...this.notes[dateKey][noteIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.saveNotes();
        return this.notes[dateKey][noteIndex];
      }
    }
    return null;
  }

  // Delete a note
  deleteNote(date, noteId) {
    const dateKey = this.getDateKey(date);
    if (this.notes[dateKey]) {
      this.notes[dateKey] = this.notes[dateKey].filter(note => note.id !== noteId);
      if (this.notes[dateKey].length === 0) {
        delete this.notes[dateKey];
      }
      this.saveNotes();
      return true;
    }
    return false;
  }

  // Check if date has notes
  hasNotes(date) {
    const dateKey = this.getDateKey(date);
    return this.notes[dateKey] && this.notes[dateKey].length > 0;
  }

  // Get all notes
  getAllNotes() {
    return this.notes;
  }

  // Get note type configurations
  getNoteTypes() {
    return [
      { value: 'info', label: 'Information', icon: 'ℹ️', color: '#2563eb' },
      { value: 'warning', label: 'Warning', icon: '⚠️', color: '#d97706' },
      { value: 'important', label: 'Important', icon: '❗', color: '#dc2626' },
      { value: 'meeting', label: 'Meeting', icon: '👥', color: '#7c3aed' },
      { value: 'deadline', label: 'Deadline', icon: '📅', color: '#be185d' },
      { value: 'reminder', label: 'Reminder', icon: '🔔', color: '#059669' },
      { value: 'celebration', label: 'Celebration', icon: '🎉', color: '#ea580c' },
      { value: 'maintenance', label: 'Maintenance', icon: '🔧', color: '#6b7280' }
    ];
  }

  // Get note type configuration
  getNoteType(type) {
    const types = this.getNoteTypes();
    return types.find(t => t.value === type) || types[0];
  }

  // Clear all notes (for testing/reset)
  clearAllNotes() {
    this.notes = {};
    this.saveNotes();
  }

  // Export notes to JSON
  exportNotes() {
    return JSON.stringify(this.notes, null, 2);
  }

  // Import notes from JSON
  importNotes(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      this.notes = { ...this.notes, ...imported };
      this.saveNotes();
      return true;
    } catch (error) {
      console.error('Error importing notes:', error);
      return false;
    }
  }
}

export default new CalendarNotesService();