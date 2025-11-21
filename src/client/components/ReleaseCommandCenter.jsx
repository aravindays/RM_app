import React, { useState, useEffect, useCallback, useRef } from 'react';
import Calendar from './Calendar.jsx';
import ReleaseFeaturesList from './ReleaseFeaturesList.jsx';
import ReleaseService from '../services/ReleaseService.js';
import HolidayService from '../services/HolidayService.js';
import CloneService from '../services/CloneService.js';
import ChangeRequestService from '../services/ChangeRequestService.js';
import CommentsService from '../services/CommentsService.js';
import './ReleaseCommandCenter.css';

export default function ReleaseCommandCenter() {
  const [releases, setReleases] = useState([]);
  const [releaseFeatures, setReleaseFeatures] = useState([]);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [holidays, setHolidays] = useState({});
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidayError, setHolidayError] = useState(null);
  const [cloneInstances, setCloneInstances] = useState([]);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [cloneError, setCloneError] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRequestLoading, setChangeRequestLoading] = useState(false);
  const [changeRequestError, setChangeRequestError] = useState(null);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  
  // Toggle states for holiday sections
  const [showHolidaySection, setShowHolidaySection] = useState(true);

  // Use refs to track ongoing operations and prevent race conditions
  const holidayAbortController = useRef(null);
  const cloneAbortController = useRef(null);
  const changeRequestAbortController = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (holidayAbortController.current) {
        holidayAbortController.current.abort();
      }
      if (cloneAbortController.current) {
        cloneAbortController.current.abort();
      }
      if (changeRequestAbortController.current) {
        changeRequestAbortController.current.abort();
      }
    };
  }, []);

  // Load comments for current month
  useEffect(() => {
    loadCommentsForMonth(currentCalendarDate);
  }, [currentCalendarDate]);

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

  // Load releases - initial load only
  useEffect(() => {
    loadReleases();
  }, []);

  // Handle initial data load
  useEffect(() => {
    if (mountedRef.current) {
      loadHolidaysForMonth(currentCalendarDate);
      loadCloneInstancesForMonth(currentCalendarDate);
    }
  }, []);

  // Load comments for specific month
  const loadCommentsForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthComments = CommentsService.getCommentsForMonth(year, month);
    setComments(monthComments);
  };

  // Add new comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const currentUser = CommentsService.getCurrentUser();
    const comment = CommentsService.addComment(newComment, currentUser.name);
    
    if (comment) {
      loadCommentsForMonth(currentCalendarDate);
      setNewComment('');
    }
  };

  // Delete comment
  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      CommentsService.deleteComment(commentId);
      loadCommentsForMonth(currentCalendarDate);
    }
  };

  // Memoized callback for handling calendar month changes
  const handleCalendarMonthChange = useCallback((newDate) => {
    if (!mountedRef.current) return;
    
    console.log('Calendar month changed to:', newDate);
    setCurrentCalendarDate(newDate);
    
    // Load data for new month with debouncing
    loadHolidaysForMonth(newDate);
    loadCloneInstancesForMonth(newDate);
    loadCommentsForMonth(newDate);
    
    // Load change requests if a release is selected
    if (selectedRelease) {
      loadChangeRequestsForMonth(newDate, selectedRelease);
    }
  }, [selectedRelease]);

  // Load current release when releases are loaded
  useEffect(() => {
    if (releases.length > 0 && !selectedRelease && mountedRef.current) {
      const currentRelease = getCurrentRelease();
      if (currentRelease) {
        handleReleaseSelect(currentRelease);
      }
    }
  }, [releases, selectedRelease]);

  const loadReleases = async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Loading releases...');
      
      const data = await ReleaseService.getReleases();
      
      if (!mountedRef.current) return;
      
      console.log('Releases loaded:', data);
      
      if (data && Array.isArray(data.result)) {
        setReleases(data.result);
      } else {
        console.warn('Invalid releases data format:', data);
        setReleases([]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Error loading releases:', err);
      setError('Failed to load releases. Please try again.');
      setReleases([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadHolidaysForMonth = async (date) => {
    if (!mountedRef.current) return;

    // Abort previous request
    if (holidayAbortController.current) {
      holidayAbortController.current.abort();
    }
    
    try {
      setHolidayLoading(true);
      setHolidayError(null);
      console.log('Loading holidays for month:', date.getFullYear(), date.getMonth() + 1);
      
      const year = date.getFullYear();
      
      // Create new abort controller for this request
      holidayAbortController.current = new AbortController();
      
      // Use setTimeout to make this truly asynchronous and non-blocking
      const holidayData = await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            if (!mountedRef.current) return;
            
            const data = await HolidayService.getAllHolidays(year);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
      
      if (!mountedRef.current) return;
      
      console.log('Holidays loaded for all countries:', holidayData);
      setHolidays(holidayData || {});
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        console.log('Holiday request aborted');
        return;
      }
      
      console.error('Error loading holidays:', err);
      setHolidayError('Failed to load holidays');
      setHolidays({});
    } finally {
      if (mountedRef.current) {
        setHolidayLoading(false);
      }
    }
  };

  const loadCloneInstancesForMonth = async (date) => {
    if (!mountedRef.current) return;

    // Abort previous request
    if (cloneAbortController.current) {
      cloneAbortController.current.abort();
    }
    
    try {
      setCloneLoading(true);
      setCloneError(null);
      console.log('Loading clone instances for month:', date.getFullYear(), date.getMonth() + 1);
      
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Create new abort controller for this request
      cloneAbortController.current = new AbortController();
      
      // Use setTimeout to make this truly asynchronous and non-blocking
      const cloneData = await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            if (!mountedRef.current) return;
            
            const data = await CloneService.getCloneInstancesForMonth(year, month);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 100); // Small delay to prevent blocking
      });
      
      if (!mountedRef.current) return;
      
      console.log('Clone instances loaded:', cloneData);
      
      if (cloneData && Array.isArray(cloneData.result)) {
        setCloneInstances(cloneData.result);
      } else {
        setCloneInstances([]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        console.log('Clone request aborted');
        return;
      }
      
      console.error('Error loading clone instances:', err);
      setCloneError('Failed to load clone instances');
      setCloneInstances([]);
    } finally {
      if (mountedRef.current) {
        setCloneLoading(false);
      }
    }
  };

  const loadChangeRequestsForMonth = async (date, release) => {
    if (!mountedRef.current || !release) return;

    // Abort previous request
    if (changeRequestAbortController.current) {
      changeRequestAbortController.current.abort();
    }
    
    try {
      setChangeRequestLoading(true);
      setChangeRequestError(null);
      
      const year = date.getFullYear();
      const month = date.getMonth();
      const releaseSysId = getSysId(release);
      
      console.log('Loading change requests for release and month:', releaseSysId, year, month + 1);
      
      // Create new abort controller for this request
      changeRequestAbortController.current = new AbortController();
      
      // Use setTimeout to make this truly asynchronous and non-blocking
      const changeRequestData = await new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            if (!mountedRef.current) return;
            
            const data = await ChangeRequestService.getChangeRequestsForRelease(releaseSysId, year, month);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        }, 150); // Small delay to prevent blocking
      });
      
      if (!mountedRef.current) return;
      
      console.log('Change requests loaded:', changeRequestData);
      
      if (changeRequestData && Array.isArray(changeRequestData.result)) {
        setChangeRequests(changeRequestData.result);
      } else {
        setChangeRequests([]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        console.log('Change request request aborted');
        return;
      }
      
      console.error('Error loading change requests:', err);
      setChangeRequestError('Failed to load change requests');
      setChangeRequests([]);
    } finally {
      if (mountedRef.current) {
        setChangeRequestLoading(false);
      }
    }
  };

  const getCurrentRelease = () => {
    const now = new Date();
    return releases.find(release => {
      try {
        const workStart = new Date(typeof release.work_start === 'object' ? release.work_start.value : release.work_start);
        const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
        
        return workStart <= now && workEnd >= now;
      } catch (error) {
        return false;
      }
    });
  };

  const handleReleaseSelect = async (release) => {
    if (!release || !mountedRef.current) return;
    
    try {
      console.log('Selecting release:', release);
      
      // Clear existing data first to prevent stale state
      setReleaseFeatures([]);
      setChangeRequests([]);
      setSelectedRelease(release);
      
      const releaseSysId = getSysId(release);
      if (!releaseSysId) {
        console.warn('No sys_id found for release:', release);
        return;
      }

      // Load release features
      console.log('Loading features for release:', releaseSysId);
      const featuresData = await ReleaseService.getReleaseFeatures(releaseSysId);
      
      if (!mountedRef.current) return;
      
      console.log('Features loaded:', featuresData);
      
      if (featuresData && Array.isArray(featuresData.result)) {
        setReleaseFeatures(featuresData.result);
      } else {
        console.warn('Invalid features data format:', featuresData);
        setReleaseFeatures([]);
      }

      // Load change requests for the current month
      loadChangeRequestsForMonth(currentCalendarDate, release);

    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Error loading release data:', err);
      setReleaseFeatures([]);
      setChangeRequests([]);
    }
  };

  const handleCreateChangeRequest = () => {
    if (!selectedRelease) {
      alert('Please select a release first');
      return;
    }
    
    const releaseSysId = getSysId(selectedRelease);
    const success = ChangeRequestService.createChangeRequest(releaseSysId);
    
    if (!success) {
      alert('Failed to open change request form. Please try again.');
    }
  };

  const getUpcomingReleases = () => {
    const now = new Date();
    return releases
      .filter(release => {
        try {
          const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
          return workEnd > now;
        } catch (error) {
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const aWorkEnd = new Date(typeof a.work_end === 'object' ? a.work_end.value : a.work_end);
          const bWorkEnd = new Date(typeof b.work_end === 'object' ? b.work_end.value : b.work_end);
          return aWorkEnd - bWorkEnd;
        } catch (error) {
          return 0;
        }
      })
      .slice(0, 2);
  };

  // Get holidays for current calendar month - synchronous operation
  const getCurrentMonthHolidays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    return HolidayService.getHolidaysForMonth(holidays, year, month);
  };

  // Get sprint impact analysis - synchronous operation
  const getSprintImpact = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const monthHolidays = getCurrentMonthHolidays();
    return HolidayService.calculateSprintImpact(monthHolidays, releases, month, year);
  };

  const formatDaysUntil = (date) => {
    try {
      const now = new Date();
      const diffTime = date - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Past';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      return `${diffDays} days`;
    } catch (error) {
      return 'Unknown';
    }
  };

  // Get clone instances for current month - synchronous filtering
  const getCurrentMonthClones = () => {
    return cloneInstances.filter(clone => {
      try {
        const scheduledDate = new Date(CloneService.getDisplayValue(clone.scheduled));
        const calendarYear = currentCalendarDate.getFullYear();
        const calendarMonth = currentCalendarDate.getMonth();
        
        return scheduledDate.getFullYear() === calendarYear && 
               scheduledDate.getMonth() === calendarMonth;
      } catch (error) {
        return false;
      }
    });
  };

  // Get change requests for current month - synchronous filtering
  const getCurrentMonthChangeRequests = () => {
    return changeRequests.filter(changeRequest => {
      try {
        const createdDate = new Date(ChangeRequestService.getDisplayValue(changeRequest.sys_created_on));
        const calendarYear = currentCalendarDate.getFullYear();
        const calendarMonth = currentCalendarDate.getMonth();
        
        return createdDate.getFullYear() === calendarYear && 
               createdDate.getMonth() === calendarMonth;
      } catch (error) {
        return false;
      }
    });
  };

  const upcomingReleases = getUpcomingReleases();
  const monthHolidays = getCurrentMonthHolidays();
  const sprintImpact = getSprintImpact();
  const monthClones = getCurrentMonthClones();
  const monthChangeRequests = getCurrentMonthChangeRequests();

  if (loading) {
    return (
      <div className="release-command-center">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Release Management Center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="release-command-center">
        <div className="error-container">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={loadReleases} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="release-command-center">
      <header className="main-header">
        <h1>🚀 Release Management Center</h1>
        <p>Unified calendar management, release tracking, clone scheduling, change requests, and team collaboration</p>
      </header>

      <div className="main-content">
        <div className="content-grid">
          {/* Left Column: Calendar and Holiday Sections */}
          <div className="calendar-column">
            {/* Calendar Section */}
            <section className="calendar-section">
              <div className="section-header">
                <h2>📅 Release Calendar</h2>
                <div className="section-subtitle">
                  Current Month: {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <Calendar
                releases={releases}
                onReleaseSelect={handleReleaseSelect}
                selectedRelease={selectedRelease}
                onMonthReleaseLoad={true}
                onMonthChange={handleCalendarMonthChange}
              />
            </section>

            {/* Holiday and Impact Analysis Row - Single row with toggle */}
            <section className="holiday-impact-row">
              <div className="section-header-with-toggle">
                <h3>🎉 Holiday & Impact Analysis ({currentCalendarDate.toLocaleDateString('en-US', { month: 'long' })})</h3>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowHolidaySection(!showHolidaySection)}
                  title={showHolidaySection ? 'Hide Section' : 'Show Section'}
                >
                  {showHolidaySection ? '🔽' : '▶️'}
                </button>
              </div>
              
              {showHolidaySection && (
                <div className="holiday-impact-content">
                  <div className="holiday-impact-grid">
                    {/* Upcoming Holidays Column */}
                    <div className="holiday-column">
                      <h4>🌟 Holidays</h4>
                      {holidayLoading ? (
                        <div className="loading-small">
                          <div className="loading-spinner-small"></div>
                          Loading holidays...
                        </div>
                      ) : holidayError ? (
                        <div className="error-small">
                          <p>⚠️ {holidayError}</p>
                          <button onClick={() => loadHolidaysForMonth(currentCalendarDate)} className="btn-small">
                            Retry
                          </button>
                        </div>
                      ) : Object.keys(monthHolidays).length > 0 ? (
                        <div className="upcoming-holidays">
                          {Object.entries(monthHolidays).map(([country, countryHolidays]) => (
                            countryHolidays.length > 0 && (
                              <div key={country} className="country-holidays">
                                <h5>
                                  {HolidayService.getCountryFlag(country)} {HolidayService.getCountryName(country)}
                                </h5>
                                {countryHolidays.map((holiday, index) => {
                                  const holidayDate = new Date(holiday.date);
                                  const daysUntil = formatDaysUntil(holidayDate);
                                  
                                  return (
                                    <div key={index} className="holiday-item">
                                      <div className="holiday-name">{holiday.localName || holiday.name}</div>
                                      <div className="holiday-timing">
                                        <span className="countdown">{daysUntil}</span>
                                        <span className="date">{holidayDate.toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">No holidays this month</p>
                      )}
                    </div>

                    {/* Sprint Impact Analysis Column */}
                    <div className="impact-column">
                      <h4>⚠️ Sprint Impact</h4>
                      {Object.keys(sprintImpact).length > 0 ? (
                        <div className="sprint-impact">
                          {Object.entries(sprintImpact).map(([country, impact]) => (
                            <div key={country} className={`impact-item impact-${impact.severity}`}>
                              <div className="impact-header">
                                <span className="country">
                                  {HolidayService.getCountryFlag(country)} {HolidayService.getCountryName(country)}
                                </span>
                                <span className={`severity-badge severity-${impact.severity}`}>
                                  {impact.severity.toUpperCase()}
                                </span>
                              </div>
                              <div className="impact-details">
                                <div className="impact-stat">
                                  <strong>{impact.holidayCount}</strong> holiday(s)
                                </div>
                                <div className="impact-stat">
                                  <strong>{impact.workdaysLost}</strong> workday(s) lost
                                </div>
                                <div className="impact-stat">
                                  <strong>{impact.affectedReleases.length}</strong> release(s) affected
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">No impact analysis available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Comments Section */}
            <section className="comments-section">
              <div className="section-header-with-toggle">
                <h3>💬 Monthly Comments ({currentCalendarDate.toLocaleDateString('en-US', { month: 'long' })})</h3>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowComments(!showComments)}
                  title={showComments ? 'Hide Comments' : 'Show Comments'}
                >
                  {showComments ? '🔽' : '▶️'}
                </button>
              </div>
              
              {showComments && (
                <div className="comments-content">
                  {/* Add Comment Form */}
                  <div className="comment-form">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment for this month..."
                      rows="3"
                      className="comment-textarea"
                    />
                    <div className="comment-actions">
                      <button 
                        onClick={handleAddComment}
                        className="btn btn-primary"
                        disabled={!newComment.trim()}
                      >
                        📝 Add Comment
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="comments-list">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-header">
                            <strong className="comment-user">{comment.user}</strong>
                            <span className="comment-timestamp">
                              {CommentsService.formatTimestamp(comment.timestamp)}
                            </span>
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="delete-comment-btn"
                              title="Delete comment"
                            >
                              🗑️
                            </button>
                          </div>
                          <div className="comment-text">
                            {comment.text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-data">No comments for this month</p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="sidebar">
            {/* Upcoming Releases */}
            <div className="sidebar-section">
              <h3>📋 Upcoming Releases (Next 2 by Release Date)</h3>
              {upcomingReleases.length > 0 ? (
                <div className="upcoming-releases">
                  {upcomingReleases.map((release, index) => {
                    const workEnd = new Date(typeof release.work_end === 'object' ? release.work_end.value : release.work_end);
                    const releaseDescription = getDisplayValue(release.short_description) || 
                                            getDisplayValue(release.description) || 
                                            'Unnamed Release';
                    const releaseNumber = getDisplayValue(release.number);
                    const daysUntil = formatDaysUntil(workEnd);
                    
                    return (
                      <div
                        key={getSysId(release)}
                        className={`upcoming-release ${selectedRelease && getSysId(selectedRelease) === getSysId(release) ? 'selected' : ''}`}
                        onClick={() => handleReleaseSelect(release)}
                      >
                        <div className="release-info">
                          <strong>{releaseNumber}</strong>
                          <span className="release-description">{releaseDescription}</span>
                        </div>
                        <div className="release-timing">
                          <span className="countdown">{daysUntil}</span>
                          <span className="date">{workEnd.toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">No upcoming releases found</p>
              )}
            </div>

            {/* Clone Schedule Section */}
            <div className="sidebar-section">
              <h3>🔄 Clone Schedule ({currentCalendarDate.toLocaleDateString('en-US', { month: 'long' })})</h3>
              {cloneLoading ? (
                <div className="loading-small">
                  <div className="loading-spinner-small"></div>
                  Loading clone instances...
                </div>
              ) : cloneError ? (
                <div className="error-small">
                  <p>⚠️ {cloneError}</p>
                  <button onClick={() => loadCloneInstancesForMonth(currentCalendarDate)} className="btn-small">
                    Retry
                  </button>
                </div>
              ) : monthClones.length > 0 ? (
                <div className="clone-instances">
                  {monthClones.map((clone) => {
                    const cloneId = CloneService.getDisplayValue(clone.clone_id);
                    const targetInstance = CloneService.getDisplayValue(clone.target_instance);
                    const scheduledDate = CloneService.getDisplayValue(clone.scheduled);
                    const state = CloneService.getDisplayValue(clone.state);
                    const sysId = CloneService.getSysId(clone);
                    const stateStyle = CloneService.getCloneStateStyle(state);
                    const scheduledInfo = CloneService.formatScheduledDate(scheduledDate);
                    const daysUntil = CloneService.getDaysUntilClone(scheduledDate);
                    
                    return (
                      <div key={sysId} className="clone-item">
                        <div className="clone-header">
                          <a 
                            href={`/clone_instance.do?sys_id=${sysId}`} 
                            className="clone-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <strong>{cloneId}</strong>
                          </a>
                          <span 
                            className="clone-state"
                            style={{ 
                              color: stateStyle.color,
                              backgroundColor: stateStyle.background 
                            }}
                          >
                            {stateStyle.icon} {state}
                          </span>
                        </div>
                        <div className="clone-details">
                          <div className="clone-target">
                            <span className="label">Target:</span>
                            <span className="value">{targetInstance}</span>
                          </div>
                          <div className="clone-timing">
                            <span className="label">Scheduled:</span>
                            <span className="value">{scheduledInfo.date} at {scheduledInfo.time}</span>
                          </div>
                          <div className="clone-countdown">
                            <span className="countdown-badge">{daysUntil}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">No clone instances scheduled this month</p>
              )}
            </div>

            {/* Change Request Section */}
            <div className="sidebar-section">
              <h3>📋 Change Requests ({currentCalendarDate.toLocaleDateString('en-US', { month: 'long' })})</h3>
              
              {/* Create Change Request Button */}
              <div className="change-request-actions">
                <button 
                  onClick={handleCreateChangeRequest}
                  className="btn btn-primary create-cr-btn"
                  disabled={!selectedRelease}
                >
                  ➕ Create Change Request
                </button>
                {!selectedRelease && (
                  <p className="help-text">Select a release to create change requests</p>
                )}
              </div>

              {/* Change Request List */}
              {changeRequestLoading ? (
                <div className="loading-small">
                  <div className="loading-spinner-small"></div>
                  Loading change requests...
                </div>
              ) : changeRequestError ? (
                <div className="error-small">
                  <p>⚠️ {changeRequestError}</p>
                  <button onClick={() => loadChangeRequestsForMonth(currentCalendarDate, selectedRelease)} className="btn-small">
                    Retry
                  </button>
                </div>
              ) : monthChangeRequests.length > 0 ? (
                <div className="change-requests">
                  {monthChangeRequests.map((changeRequest) => {
                    const number = ChangeRequestService.getDisplayValue(changeRequest.number);
                    const cmdbCi = ChangeRequestService.getDisplayValue(changeRequest.cmdb_ci);
                    const state = ChangeRequestService.getDisplayValue(changeRequest.state);
                    const approval = ChangeRequestService.getDisplayValue(changeRequest.approval);
                    const shortDescription = ChangeRequestService.getDisplayValue(changeRequest.short_description);
                    const sysId = ChangeRequestService.getSysId(changeRequest);
                    const stateStyle = ChangeRequestService.getChangeRequestStateStyle(state);
                    const approvalStyle = ChangeRequestService.getApprovalStyle(approval);
                    const createdDate = ChangeRequestService.formatCreatedDate(
                      ChangeRequestService.getDisplayValue(changeRequest.sys_created_on)
                    );
                    
                    return (
                      <div key={sysId} className="change-request-item">
                        <div className="cr-header">
                          <a 
                            href={`/change_request.do?sys_id=${sysId}`} 
                            className="cr-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <strong>{number}</strong>
                          </a>
                          <span 
                            className="cr-state"
                            style={{ 
                              color: stateStyle.color,
                              backgroundColor: stateStyle.background 
                            }}
                          >
                            {stateStyle.icon} {state}
                          </span>
                        </div>
                        
                        <div className="cr-details">
                          <div className="cr-description">
                            {shortDescription}
                          </div>
                          
                          {cmdbCi && (
                            <div className="cr-ci">
                              <span className="label">CI:</span>
                              <span className="value">{cmdbCi}</span>
                            </div>
                          )}
                          
                          <div className="cr-approval">
                            <span className="label">Approval:</span>
                            <span 
                              className="approval-badge"
                              style={{ 
                                color: approvalStyle.color,
                                backgroundColor: approvalStyle.background 
                              }}
                            >
                              {approvalStyle.icon} {approval}
                            </span>
                          </div>
                          
                          <div className="cr-created">
                            <span className="label">Created:</span>
                            <span className="value">{createdDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">
                  {selectedRelease 
                    ? 'No change requests for this release this month' 
                    : 'Select a release to view change requests'
                  }
                </p>
              )}
            </div>

            {/* Selected Release Summary */}
            {selectedRelease && (
              <div className="sidebar-section">
                <h3>📊 Release Summary</h3>
                <div className="release-summary">
                  <div className="summary-item">
                    <strong>Release:</strong> {getDisplayValue(selectedRelease.number)}
                  </div>
                  <div className="summary-item">
                    <strong>Description:</strong> {getDisplayValue(selectedRelease.short_description) || getDisplayValue(selectedRelease.description)}
                  </div>
                  <div className="summary-item">
                    <strong>Features:</strong> {releaseFeatures.length}
                  </div>
                  <div className="summary-item">
                    <strong>UAT Completed:</strong> {releaseFeatures.filter(f => f.uat_completed === true || f.uat_completed === 'true').length}
                  </div>
                  <div className="summary-item">
                    <strong>Approved:</strong> {releaseFeatures.filter(f => getDisplayValue(f.state) === 'approved').length}
                  </div>
                  <div className="summary-item">
                    <strong>Change Requests:</strong> {changeRequests.length}
                  </div>
                  <div className="summary-item">
                    <strong>Comments:</strong> {comments.length}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Release Features Section */}
        {selectedRelease && (
          <section className="features-section">
            <div className="section-header">
              <h2>🎯 Release Features</h2>
              <div className="section-subtitle">
                Features for {getDisplayValue(selectedRelease.number)} - {getDisplayValue(selectedRelease.short_description) || getDisplayValue(selectedRelease.description)}
              </div>
            </div>
            <ReleaseFeaturesList
              releaseFeatures={releaseFeatures}
              selectedRelease={selectedRelease}
              onUpdate={() => handleReleaseSelect(selectedRelease)}
            />
          </section>
        )}
      </div>
    </div>
  );
}