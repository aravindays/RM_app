import React, { useState, useEffect } from 'react';
import CalendarNotesService from '../services/CalendarNotesService.js';
import './Calendar.css';

export default function Calendar({ releases, onReleaseSelect, selectedRelease, onMonthReleaseLoad, onMonthChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [noteForm, setNoteForm] = useState({ type: 'info', description: '' });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Notify parent component when month changes
  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentDate);
    }
  }, [currentDate, onMonthChange]);

  // Auto-load release features for releases in current month view
  useEffect(() => {
    if (viewType === 'month' && onMonthReleaseLoad) {
      const monthReleases = getReleasesInCurrentMonth();
      if (monthReleases.length > 0 && !selectedRelease) {
        onReleaseSelect(monthReleases[0]);
      }
    }
  }, [currentDate, viewType, releases, onMonthReleaseLoad, selectedRelease, onReleaseSelect]);

  // Helper functions for safe field extraction
  const getDisplayValue = (field) => {
    if (!field) return '';
    if (typeof field === 'object' && field.display_value !== undefined) {
      return field.display_value;
    }
    if (typeof field === 'object' && field.value !== undefined) {
      return field.value;
    }
    return String(field);
  };

  const getSysId = (record) => {
    if (!record) return null;
    if (typeof record.sys_id === 'object' && record.sys_id.value) {
      return record.sys_id.value;
    }
    return record.sys_id;
  };

  // Get releases in current month
  const getReleasesInCurrentMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return releases.filter(release => {
      const workStart = new Date(typeof release.work_start === 'object' ? release.work_start.value : release.work_start);
      const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
      
      return (workStart.getFullYear() === year && workStart.getMonth() === month) ||
             (workEnd.getFullYear() === year && workEnd.getMonth() === month);
    });
  };

  // Get calendar data for current month
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // Get releases for a specific date
  const getReleasesForDate = (date) => {
    return releases.filter(release => {
      const workStart = new Date(typeof release.work_start === 'object' ? release.work_start.value : release.work_start);
      const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
      
      const dateStr = date.toISOString().split('T')[0];
      const startStr = workStart.toISOString().split('T')[0];
      const endStr = workEnd.toISOString().split('T')[0];
      
      return dateStr === startStr || dateStr === endStr;
    });
  };

  // Handle adding note to calendar
  const handleAddNote = (date, e) => {
    e.stopPropagation();
    setSelectedDate(date);
    setNoteForm({ type: 'info', description: '' });
    setShowNoteModal(true);
  };

  // Save note
  const handleSaveNote = () => {
    if (selectedDate && noteForm.description.trim()) {
      CalendarNotesService.addNote(selectedDate, noteForm);
      setShowNoteModal(false);
      setNoteForm({ type: 'info', description: '' });
      // Force re-render by updating state
      setCurrentDate(new Date(currentDate));
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in current month
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Sort releases by work_end date for year view
  const sortedReleasesForYear = [...releases].sort((a, b) => {
    const aWorkEnd = new Date(typeof a.work_end === 'object' ? a.work_end.value : a.work_end);
    const bWorkEnd = new Date(typeof b.work_end === 'object' ? b.work_end.value : b.work_end);
    return aWorkEnd - bWorkEnd;
  });

  const calendarDays = getCalendarData();
  const noteTypes = CalendarNotesService.getNoteTypes();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={() => navigateMonth(-1)} className="nav-btn">&lt;</button>
          <h2 className="calendar-title">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => navigateMonth(1)} className="nav-btn">&gt;</button>
        </div>
        <div className="view-controls">
          <button 
            className={`view-btn ${viewType === 'month' ? 'active' : ''}`}
            onClick={() => setViewType('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${viewType === 'year' ? 'active' : ''}`}
            onClick={() => setViewType('year')}
          >
            Year
          </button>
        </div>
      </div>

      {viewType === 'month' && (
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {daysOfWeek.map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {calendarDays.map((date, index) => {
              const dayReleases = getReleasesForDate(date);
              const dayNotes = CalendarNotesService.getNotesForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDay = isToday(date);
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${!isCurrentMonthDay ? 'other-month' : ''} ${isTodayDay ? 'today' : ''} ${dayNotes.length > 0 ? 'has-notes' : ''}`}
                >
                  <div className="day-header">
                    <span className="day-number">{date.getDate()}</span>
                    <button 
                      className="add-note-btn" 
                      onClick={(e) => handleAddNote(date, e)}
                      title="Add note"
                    >
                      ➕
                    </button>
                  </div>

                  {/* Display Notes */}
                  {dayNotes.map(note => {
                    const noteType = CalendarNotesService.getNoteType(note.type);
                    return (
                      <div
                        key={note.id}
                        className="calendar-note"
                        style={{ borderLeft: `3px solid ${noteType.color}` }}
                        title={`${noteType.label}: ${note.description}`}
                      >
                        <span className="note-icon">{noteType.icon}</span>
                        <span className="note-text">{note.description.substring(0, 20)}...</span>
                      </div>
                    );
                  })}

                  {/* Display Releases */}
                  {dayReleases.map(release => {
                    const workStart = new Date(typeof release.work_start === 'object' ? release.work_start.value : release.work_start);
                    const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
                    const releaseName = getDisplayValue(release.short_description) || 
                                     getDisplayValue(release.description) || 
                                     'Unnamed Release';
                    const releaseNumber = getDisplayValue(release.number);
                    const releaseSysId = getSysId(release);
                    
                    const dateStr = date.toISOString().split('T')[0];
                    const startStr = workStart.toISOString().split('T')[0];
                    const endStr = workEnd.toISOString().split('T')[0];
                    
                    const isStart = dateStr === startStr;
                    const isEnd = dateStr === endStr;
                    
                    return (
                      <div
                        key={releaseSysId}
                        className={`release-event ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${selectedRelease && getSysId(selectedRelease) === releaseSysId ? 'selected' : ''}`}
                        onClick={() => onReleaseSelect(release)}
                        title={`${releaseNumber}: ${releaseName}`}
                      >
                        <span className="release-icon">{isStart ? '🚀' : '📦'}</span>
                        <div className="release-content">
                          <span className="release-number">{releaseNumber}</span>
                          <span className="release-desc">{releaseName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewType === 'year' && (
        <div className="year-view">
          <div className="year-releases">
            <h3>2026 Release Schedule (Sorted by Release Date)</h3>
            {sortedReleasesForYear.map(release => {
              const workStart = new Date(typeof release.work_start === 'object' ? release.work_start.value : release.work_start);
              const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
              const releaseName = getDisplayValue(release.short_description) || 
                               getDisplayValue(release.description) || 
                               'Unnamed Release';
              const releaseNumber = getDisplayValue(release.number);
              const releaseSysId = getSysId(release);
              
              return (
                <div
                  key={releaseSysId}
                  className={`year-release-item ${selectedRelease && getSysId(selectedRelease) === releaseSysId ? 'selected' : ''}`}
                  onClick={() => onReleaseSelect(release)}
                >
                  <div className="release-info">
                    <strong>{releaseNumber}</strong>
                    <span className="release-dates">
                      Start: {workStart.toLocaleDateString()} | Release: {workEnd.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="release-desc">{releaseName}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Note - {selectedDate?.toLocaleDateString()}</h3>
              <button onClick={() => setShowNoteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Note Type:</label>
                <select 
                  value={noteForm.type} 
                  onChange={(e) => setNoteForm({...noteForm, type: e.target.value})}
                >
                  {noteTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({...noteForm, description: e.target.value})}
                  placeholder="Enter note description..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNoteModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleSaveNote} 
                className="btn btn-primary"
                disabled={!noteForm.description.trim()}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}