import React, { useState, useEffect, useMemo } from 'react';
import './ReleaseFeaturesList.css';

export default function ReleaseFeaturesList({ releaseFeatures, onUpdate, onDelete, onAdd, users, selectedRelease }) {
  // Helper functions - MOVED TO TOP to fix hoisting issue
  const getDisplayValue = (field) => {
    return typeof field === 'object' ? field.display_value : field;
  };

  const getSysId = (field) => {
    return typeof field === 'object' ? field.value : field;
  };

  // State variables
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'deployment_sequence', direction: 'asc' });
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingFeature, setReviewingFeature] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filters, setFilters] = useState({ 
    product: [], 
    search: '' 
  });
  
  // Updated visible columns to include ALL table fields
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    number: false,
    story_number: true,
    product: true,
    short_description: true,
    developer: true,
    uat_completed: true,
    deployment_type: false,
    update_set_name: false,
    application_scope: false,
    out_of_update_set: false,
    deployment_sequence: true,
    deployment_dependency: false,
    pre_deployment_activities: false,
    post_deployment_activities: false,
    review_comments: false,
    techlead: false,
    state: true,
    estimated_duration: false,
    actual_duration: false,
    rollback_procedure: false,
    validation_steps: false
  });
  
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [savingCells, setSavingCells] = useState(new Set());
  const [cellStates, setCellStates] = useState(new Map());

  // Product configuration with colors and specific icons
  const productConfig = {
    itsm: { color: '#3B82F6', icon: '🎫', label: 'ITSM' },
    itom: { color: '#10B981', icon: '📊', label: 'ITOM' },
    itam: { color: '#F59E0B', icon: '💼', label: 'ITAM' },
    apm: { color: '#8B5CF6', icon: '📱', label: 'APM' },
    sdo: { color: '#EC4899', icon: '🚀', label: 'SDO' },
    irm: { color: '#EF4444', icon: '🛡️', label: 'IRM' },
    hrsd: { color: '#06B6D4', icon: '👥', label: 'HRSD' },
    lsd: { color: '#6366F1', icon: '⚖️', label: 'LSD' },
    spm: { color: '#14B8A6', icon: '📈', label: 'SPM' }
  };

  // Calculate product counts - NOW SAFE since helper functions are defined above
  const productCounts = useMemo(() => {
    if (!releaseFeatures || !Array.isArray(releaseFeatures)) {
      return {};
    }

    const counts = {};
    Object.keys(productConfig).forEach(product => {
      counts[product] = releaseFeatures.filter(feature => 
        getSysId(feature.product) === product
      ).length;
    });
    return counts;
  }, [releaseFeatures]);

  // Field validation
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'story_number':
        if (!value || value.trim() === '') return 'Story number is required';
        if (!/^[A-Z]+-\d+-\d+$/.test(value)) return 'Format: PRODUCT-YEAR-NUMBER (e.g., ITSM-2026-001)';
        break;
      case 'short_description':
        if (!value || value.trim() === '') return 'Description is required';
        if (value.length > 255) return 'Description must be less than 255 characters';
        break;
      case 'deployment_sequence':
        if (!value || isNaN(value)) return 'Sequence must be a number';
        break;
    }
    return null;
  };

  // Filter and sort features - SAFE since helper functions are defined
  const filteredAndSortedFeatures = useMemo(() => {
    if (!releaseFeatures || !Array.isArray(releaseFeatures)) {
      return [];
    }

    let filtered = [...releaseFeatures];

    // Apply product filter
    if (filters.product.length > 0) {
      filtered = filtered.filter(feature => 
        filters.product.includes(getSysId(feature.product))
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(feature => 
        getDisplayValue(feature.story_number)?.toLowerCase().includes(searchTerm) ||
        getDisplayValue(feature.short_description)?.toLowerCase().includes(searchTerm) ||
        getDisplayValue(feature.update_set_name)?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort features
    filtered.sort((a, b) => {
      let aValue = getDisplayValue(a[sortConfig.key]) || '';
      let bValue = getDisplayValue(b[sortConfig.key]) || '';

      // Handle numeric fields
      if (sortConfig.key === 'deployment_sequence' || sortConfig.key === 'estimated_duration') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [releaseFeatures, filters, sortConfig]);

  // Export to Excel function
  const exportToExcel = () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one record to export');
      return;
    }

    const selectedFeatures = filteredAndSortedFeatures.filter(feature => 
      selectedRows.has(getSysId(feature.sys_id))
    );

    // Create CSV content
    const headers = Object.keys(visibleColumns)
      .filter(col => visibleColumns[col] && col !== 'select')
      .map(col => col.replace(/_/g, ' ').toUpperCase());

    const csvContent = [
      headers.join(','),
      ...selectedFeatures.map(feature => 
        Object.keys(visibleColumns)
          .filter(col => visibleColumns[col] && col !== 'select')
          .map(col => {
            let value = getDisplayValue(feature[col]) || '';
            // Escape commas and quotes in CSV
            if (value.includes(',') || value.includes('"')) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `release-features-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle row selection
  const handleRowSelect = (featureSysId, checked) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(featureSysId);
    } else {
      newSelectedRows.delete(featureSysId);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedFeatures.map(feature => getSysId(feature.sys_id)));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle cell editing with validation and conflict detection
  const handleCellClick = (recordId, fieldName, currentValue) => {
    const cellKey = `${recordId}-${fieldName}`;
    if (savingCells.has(cellKey)) return;

    setEditingCell(cellKey);
    setEditValue(getDisplayValue(currentValue) || '');
  };

  const handleCellSave = async (record, fieldName) => {
    const recordSysId = getSysId(record.sys_id);
    const cellKey = `${recordSysId}-${fieldName}`;
    
    // Validate field
    const validation = validateField(fieldName, editValue);
    if (validation) {
      alert('Validation Error: ' + validation);
      return;
    }
    
    try {
      setSavingCells(prev => new Set([...prev, cellKey]));
      
      await onUpdate(recordSysId, { [fieldName]: editValue });
      
      // Show success feedback
      setCellStates(prev => new Map([...prev, [cellKey, 'success']]));
      setTimeout(() => {
        setCellStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(cellKey);
          return newMap;
        });
      }, 2000);

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error saving cell:', error);
      
      // Show error feedback
      setCellStates(prev => new Map([...prev, [cellKey, 'error']]));
      setTimeout(() => {
        setCellStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(cellKey);
          return newMap;
        });
      }, 3000);

      // Conflict detection simulation
      if (error.message.includes('conflict') || error.message.includes('modified')) {
        const overwrite = window.confirm('User Admin updated this field 2 min ago. Overwrite? [Yes] [No]');
        if (overwrite) {
          try {
            await onUpdate(recordSysId, { [fieldName]: editValue });
            setEditingCell(null);
            setEditValue('');
          } catch (retryError) {
            alert('Failed to save changes: ' + retryError.message);
          }
        }
      } else {
        alert('Failed to save changes: ' + error.message);
      }
    } finally {
      setSavingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Toggle product filter
  const toggleProductFilter = (product) => {
    const newProductFilters = filters.product.includes(product)
      ? filters.product.filter(p => p !== product)
      : [...filters.product, product];
    setFilters({...filters, product: newProductFilters});
  };

  // Open review modal
  const handleReviewClick = (feature) => {
    setReviewingFeature(feature);
    setShowReviewModal(true);
  };

  // Render editable cell with enhanced feedback
  const renderEditableCell = (record, fieldName, fieldValue, fieldType = 'text') => {
    const recordSysId = getSysId(record.sys_id);
    const cellKey = `${recordSysId}-${fieldName}`;
    const isEditing = editingCell === cellKey;
    const displayValue = getDisplayValue(fieldValue);
    const isSaving = savingCells.has(cellKey);
    const cellState = cellStates.get(cellKey);

    if (isEditing) {
      if (fieldType === 'boolean') {
        return (
          <div className="editing-cell">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleCellSave(record, fieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave(record, fieldName);
                if (e.key === 'Escape') handleCellCancel();
              }}
              autoFocus
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        );
      }

      if (fieldType === 'choice' && fieldName === 'state') {
        const stateOptions = [
          { value: 'draft', label: 'Draft' },
          { value: 'ready', label: 'Ready for Review' },
          { value: 'review', label: 'In Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'deployed', label: 'Deployed' },
          { value: 'failed', label: 'Failed' },
          { value: 'rollback', label: 'Rollback' }
        ];

        return (
          <div className="editing-cell">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleCellSave(record, fieldName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave(record, fieldName);
                if (e.key === 'Escape') handleCellCancel();
              }}
              autoFocus
            >
              {stateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      }

      return (
        <div className="editing-cell">
          <input
            type={fieldType === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellSave(record, fieldName)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave(record, fieldName);
              if (e.key === 'Escape') handleCellCancel();
            }}
            autoFocus
          />
        </div>
      );
    }

    return (
      <div
        className={`editable-cell ${isSaving ? 'saving' : ''} ${cellState ? `cell-${cellState}` : ''}`}
        onClick={() => handleCellClick(recordSysId, fieldName, fieldValue)}
      >
        {isSaving && <div className="saving-spinner"></div>}
        {cellState === 'success' && <div className="success-checkmark">✓</div>}
        {cellState === 'error' && <div className="error-icon">✗</div>}
        <div className="cell-content">
          {fieldType === 'boolean' ? (String(displayValue) === 'true' ? '✓ Yes' : '✗ No') : displayValue || '-'}
        </div>
      </div>
    );
  };

  const getStateIcon = (state) => {
    const stateValue = getDisplayValue(state);
    switch (stateValue?.toLowerCase()) {
      case 'draft': return '📝';
      case 'ready': return '📋';
      case 'review': return '👁️';
      case 'approved': return '✅';
      case 'deployed': return '🚀';
      case 'failed': return '❌';
      case 'rollback': return '↩️';
      default: return '📄';
    }
  };

  // Review Modal Component
  const ReviewModal = () => {
    const [reviewData, setReviewData] = useState({
      post_deployment_activities: '',
      review_comments: '',
      deployment_dependency: '',
      pre_deployment_activities: ''
    });

    useEffect(() => {
      if (reviewingFeature) {
        setReviewData({
          post_deployment_activities: getDisplayValue(reviewingFeature.post_deployment_activities) || '',
          review_comments: getDisplayValue(reviewingFeature.review_comments) || '',
          deployment_dependency: getDisplayValue(reviewingFeature.deployment_dependency) || '',
          pre_deployment_activities: getDisplayValue(reviewingFeature.pre_deployment_activities) || ''
        });
      }
    }, [reviewingFeature]);

    const handleReviewSubmit = async (e) => {
      e.preventDefault();
      try {
        const featureSysId = getSysId(reviewingFeature.sys_id);
        await onUpdate(featureSysId, reviewData);
        setShowReviewModal(false);
        setReviewingFeature(null);
      } catch (error) {
        alert('Failed to update review: ' + error.message);
      }
    };

    if (!showReviewModal || !reviewingFeature) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content review-modal">
          <div className="modal-header">
            <h3>Review Feature: {getDisplayValue(reviewingFeature.story_number)}</h3>
            <button onClick={() => setShowReviewModal(false)} className="close-btn">×</button>
          </div>
          <form onSubmit={handleReviewSubmit} className="review-form">
            <div className="form-field full-width">
              <label>Pre-deployment Activities</label>
              <textarea
                value={reviewData.pre_deployment_activities}
                onChange={(e) => setReviewData({...reviewData, pre_deployment_activities: e.target.value})}
                placeholder="Activities to complete before deployment"
                rows="4"
              />
            </div>

            <div className="form-field full-width">
              <label>Post-deployment Activities</label>
              <textarea
                value={reviewData.post_deployment_activities}
                onChange={(e) => setReviewData({...reviewData, post_deployment_activities: e.target.value})}
                placeholder="Activities to complete after deployment"
                rows="4"
              />
            </div>

            <div className="form-field full-width">
              <label>Deployment Dependencies</label>
              <textarea
                value={reviewData.deployment_dependency}
                onChange={(e) => setReviewData({...reviewData, deployment_dependency: e.target.value})}
                placeholder="Dependencies and coordination requirements"
                rows="3"
              />
            </div>

            <div className="form-field full-width">
              <label>Review Comments</label>
              <textarea
                value={reviewData.review_comments}
                onChange={(e) => setReviewData({...reviewData, review_comments: e.target.value})}
                placeholder="Tech lead or architect review comments"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowReviewModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Save Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Enhanced New Feature Modal with ALL fields
  const NewFeatureModal = () => {
    const [newFeatureData, setNewFeatureData] = useState({
      story_number: '',
      product: 'itsm',
      short_description: '',
      developer: '',
      deployment_type: 'update_set',
      update_set_name: '',
      application_scope: '',
      out_of_update_set: false,
      deployment_sequence: Math.max(...(releaseFeatures || []).map(f => f.deployment_sequence || 0), 0) + 10,
      deployment_dependency: '',
      pre_deployment_activities: '',
      post_deployment_activities: '',
      review_comments: '',
      techlead: '',
      state: 'draft',
      uat_completed: false,
      estimated_duration: 60,
      actual_duration: '',
      rollback_procedure: '',
      validation_steps: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const releaseId = getSysId(selectedRelease.sys_id);
        await onAdd({ ...newFeatureData, release: releaseId });
        setShowNewModal(false);
      } catch (error) {
        alert('Failed to create feature: ' + error.message);
      }
    };

    if (!showNewModal) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content new-feature-modal">
          <div className="modal-header">
            <h3>New Release Feature</h3>
            <button onClick={() => setShowNewModal(false)} className="close-btn">×</button>
          </div>
          <form onSubmit={handleSubmit} className="new-feature-form">
            <div className="form-grid">
              <div className="form-field">
                <label>Story Number *</label>
                <input
                  type="text"
                  value={newFeatureData.story_number}
                  onChange={(e) => setNewFeatureData({...newFeatureData, story_number: e.target.value})}
                  placeholder="e.g., ITSM-2026-001"
                  required
                />
              </div>
              
              <div className="form-field">
                <label>Product *</label>
                <select
                  value={newFeatureData.product}
                  onChange={(e) => setNewFeatureData({...newFeatureData, product: e.target.value})}
                  required
                >
                  {Object.entries(productConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field full-width">
                <label>Short Description *</label>
                <input
                  type="text"
                  value={newFeatureData.short_description}
                  onChange={(e) => setNewFeatureData({...newFeatureData, short_description: e.target.value})}
                  placeholder="Brief description of the feature"
                  required
                />
              </div>

              <div className="form-field">
                <label>Developer *</label>
                <select
                  value={newFeatureData.developer}
                  onChange={(e) => setNewFeatureData({...newFeatureData, developer: e.target.value})}
                  required
                >
                  <option value="">Select Developer</option>
                  {users && users.map(user => (
                    <option key={getSysId(user.sys_id)} value={getSysId(user.sys_id)}>
                      {getDisplayValue(user.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Tech Lead</label>
                <select
                  value={newFeatureData.techlead}
                  onChange={(e) => setNewFeatureData({...newFeatureData, techlead: e.target.value})}
                >
                  <option value="">Select Tech Lead</option>
                  {users && users.map(user => (
                    <option key={getSysId(user.sys_id)} value={getSysId(user.sys_id)}>
                      {getDisplayValue(user.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Deployment Type *</label>
                <select
                  value={newFeatureData.deployment_type}
                  onChange={(e) => setNewFeatureData({...newFeatureData, deployment_type: e.target.value})}
                  required
                >
                  <option value="update_set">Update Set</option>
                  <option value="manual_config">Manual Configuration</option>
                  <option value="data_load">Data Load</option>
                  <option value="xml_import">XML Import</option>
                  <option value="plugin">Plugin Activation</option>
                  <option value="pre_deploy">Pre-deployment Step</option>
                  <option value="post_deploy">Post-deployment Step</option>
                  <option value="batch">Batch Update</option>
                </select>
              </div>

              <div className="form-field">
                <label>Deployment Sequence *</label>
                <input
                  type="number"
                  value={newFeatureData.deployment_sequence}
                  onChange={(e) => setNewFeatureData({...newFeatureData, deployment_sequence: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="form-field">
                <label>Estimated Duration (minutes)</label>
                <input
                  type="number"
                  value={newFeatureData.estimated_duration}
                  onChange={(e) => setNewFeatureData({...newFeatureData, estimated_duration: parseInt(e.target.value)})}
                />
              </div>

              <div className="form-field full-width">
                <label>Update Set Name</label>
                <input
                  type="text"
                  value={newFeatureData.update_set_name}
                  onChange={(e) => setNewFeatureData({...newFeatureData, update_set_name: e.target.value})}
                  placeholder="Update set name (if applicable)"
                />
              </div>

              <div className="form-field full-width">
                <label>Application Scope</label>
                <input
                  type="text"
                  value={newFeatureData.application_scope}
                  onChange={(e) => setNewFeatureData({...newFeatureData, application_scope: e.target.value})}
                  placeholder="Application scope"
                />
              </div>

              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={newFeatureData.out_of_update_set}
                    onChange={(e) => setNewFeatureData({...newFeatureData, out_of_update_set: e.target.checked})}
                  />
                  Out of Update Set
                </label>
              </div>

              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={newFeatureData.uat_completed}
                    onChange={(e) => setNewFeatureData({...newFeatureData, uat_completed: e.target.checked})}
                  />
                  UAT Completed
                </label>
              </div>

              <div className="form-field full-width">
                <label>Deployment Dependencies</label>
                <textarea
                  value={newFeatureData.deployment_dependency}
                  onChange={(e) => setNewFeatureData({...newFeatureData, deployment_dependency: e.target.value})}
                  placeholder="Dependencies or coordination requirements"
                  rows="2"
                />
              </div>

              <div className="form-field full-width">
                <label>Pre-deployment Activities</label>
                <textarea
                  value={newFeatureData.pre_deployment_activities}
                  onChange={(e) => setNewFeatureData({...newFeatureData, pre_deployment_activities: e.target.value})}
                  placeholder="Activities to complete before deployment"
                  rows="3"
                />
              </div>

              <div className="form-field full-width">
                <label>Post-deployment Activities</label>
                <textarea
                  value={newFeatureData.post_deployment_activities}
                  onChange={(e) => setNewFeatureData({...newFeatureData, post_deployment_activities: e.target.value})}
                  placeholder="Validation and post-deployment tasks"
                  rows="3"
                />
              </div>

              <div className="form-field full-width">
                <label>Validation Steps</label>
                <textarea
                  value={newFeatureData.validation_steps}
                  onChange={(e) => setNewFeatureData({...newFeatureData, validation_steps: e.target.value})}
                  placeholder="Steps to validate the deployment"
                  rows="2"
                />
              </div>

              <div className="form-field full-width">
                <label>Rollback Procedure</label>
                <textarea
                  value={newFeatureData.rollback_procedure}
                  onChange={(e) => setNewFeatureData({...newFeatureData, rollback_procedure: e.target.value})}
                  placeholder="Steps to rollback if needed"
                  rows="2"
                />
              </div>

              <div className="form-field full-width">
                <label>Review Comments</label>
                <textarea
                  value={newFeatureData.review_comments}
                  onChange={(e) => setNewFeatureData({...newFeatureData, review_comments: e.target.value})}
                  placeholder="Tech lead or architect comments"
                  rows="2"
                />
              </div>

              <div className="form-field full-width">
                <label>Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    // Handle file upload - Note: This would need server-side implementation
                    console.log('Files selected:', e.target.files);
                    // In a real implementation, you'd upload these files to ServiceNow
                    alert('File upload functionality would be implemented on the server side');
                  }}
                />
                <small className="help-text">Select files to attach to this release feature</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowNewModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Create Feature
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Early return if no release features
  if (!releaseFeatures || releaseFeatures.length === 0) {
    return (
      <div className="release-features-empty">
        <p>No release features found for this release.</p>
        <button onClick={() => setShowNewModal(true)} className="add-feature-btn">
          + Add First Feature
        </button>
        <NewFeatureModal />
      </div>
    );
  }

  return (
    <div className="release-features-container">
      {/* Product counts header with colors and icons */}
      <div className="product-counts-header">
        <h4>Features by Product</h4>
        <div className="product-counts">
          {Object.entries(productConfig).map(([product, config]) => (
            <div 
              key={product} 
              className={`product-count ${filters.product.includes(product) ? 'selected' : ''}`}
              style={{ borderColor: config.color }}
              onClick={() => toggleProductFilter(product)}
            >
              <span className="product-icon" style={{ color: config.color }}>{config.icon}</span>
              <span className="product-label">{config.label}</span>
              <span className="product-count-badge" style={{ backgroundColor: config.color }}>
                {productCounts[product] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and actions */}
      <div className="filters-actions">
        <div className="filters">
          <input
            type="text"
            placeholder="Search story#, description, or update set..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="search-input"
          />
          <button 
            onClick={() => setFilters({ product: [], search: '' })} 
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
        <div className="actions">
          <button 
            onClick={exportToExcel}
            className="export-btn"
            disabled={selectedRows.size === 0}
          >
            📊 Export ({selectedRows.size})
          </button>
          <button onClick={() => setShowNewModal(true)} className="add-feature-btn">
            + New Feature
          </button>
          <button onClick={() => setShowColumnManager(!showColumnManager)} className="column-manager-btn">
            ⚙️ Columns
          </button>
        </div>
      </div>

      {/* Column manager */}
      {showColumnManager && (
        <div className="column-manager">
          <h5>Column Visibility</h5>
          <div className="column-toggles">
            {Object.entries(visibleColumns).filter(([col]) => col !== 'select').map(([column, visible]) => (
              <label key={column} className="column-toggle">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisibleColumns({...visibleColumns, [column]: e.target.checked})}
                />
                {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="results-summary">
        Showing {filteredAndSortedFeatures.length} of {releaseFeatures.length} features
        {selectedRows.size > 0 && (
          <span className="selection-info"> • {selectedRows.size} selected</span>
        )}
        {filters.product.length > 0 && (
          <span className="filter-info">
            • Filtered by: {filters.product.map(p => productConfig[p].label).join(', ')}
          </span>
        )}
        {filters.search && (
          <span className="search-info">• Search: "{filters.search}"</span>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="release-features-table">
          <thead>
            <tr>
              {visibleColumns.select && (
                <th>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredAndSortedFeatures.length && filteredAndSortedFeatures.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {visibleColumns.number && (
                <th onClick={() => handleSort('number')} className="sortable">
                  Number {sortConfig.key === 'number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.story_number && (
                <th onClick={() => handleSort('story_number')} className="sortable">
                  Story# {sortConfig.key === 'story_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.product && (
                <th onClick={() => handleSort('product')} className="sortable">
                  Product {sortConfig.key === 'product' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.short_description && (
                <th onClick={() => handleSort('short_description')} className="sortable">
                  Description {sortConfig.key === 'short_description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.developer && (
                <th onClick={() => handleSort('developer')} className="sortable">
                  Developer {sortConfig.key === 'developer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.techlead && (
                <th onClick={() => handleSort('techlead')} className="sortable">
                  Tech Lead {sortConfig.key === 'techlead' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.uat_completed && (
                <th onClick={() => handleSort('uat_completed')} className="sortable">
                  UAT {sortConfig.key === 'uat_completed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.deployment_type && (
                <th onClick={() => handleSort('deployment_type')} className="sortable">
                  Type {sortConfig.key === 'deployment_type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.update_set_name && (
                <th onClick={() => handleSort('update_set_name')} className="sortable">
                  Update Set {sortConfig.key === 'update_set_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.application_scope && (
                <th onClick={() => handleSort('application_scope')} className="sortable">
                  App Scope {sortConfig.key === 'application_scope' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.out_of_update_set && (
                <th onClick={() => handleSort('out_of_update_set')} className="sortable">
                  Out of Update Set {sortConfig.key === 'out_of_update_set' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.deployment_sequence && (
                <th onClick={() => handleSort('deployment_sequence')} className="sortable">
                  Seq {sortConfig.key === 'deployment_sequence' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.estimated_duration && (
                <th onClick={() => handleSort('estimated_duration')} className="sortable">
                  Est. Duration {sortConfig.key === 'estimated_duration' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.actual_duration && (
                <th onClick={() => handleSort('actual_duration')} className="sortable">
                  Actual Duration {sortConfig.key === 'actual_duration' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.state && (
                <th onClick={() => handleSort('state')} className="sortable">
                  State {sortConfig.key === 'state' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.deployment_dependency && (
                <th onClick={() => handleSort('deployment_dependency')} className="sortable">
                  Dependencies {sortConfig.key === 'deployment_dependency' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.pre_deployment_activities && (
                <th onClick={() => handleSort('pre_deployment_activities')} className="sortable">
                  Pre Activities {sortConfig.key === 'pre_deployment_activities' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.post_deployment_activities && (
                <th onClick={() => handleSort('post_deployment_activities')} className="sortable">
                  Post Activities {sortConfig.key === 'post_deployment_activities' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.review_comments && (
                <th onClick={() => handleSort('review_comments')} className="sortable">
                  Review Comments {sortConfig.key === 'review_comments' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.rollback_procedure && (
                <th onClick={() => handleSort('rollback_procedure')} className="sortable">
                  Rollback {sortConfig.key === 'rollback_procedure' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              {visibleColumns.validation_steps && (
                <th onClick={() => handleSort('validation_steps')} className="sortable">
                  Validation {sortConfig.key === 'validation_steps' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedFeatures.map(feature => {
              const featureSysId = getSysId(feature.sys_id);
              const productValue = getSysId(feature.product);
              const productConf = productConfig[productValue] || { color: '#666', icon: '📄' };
              
              return (
                <tr key={featureSysId} className="feature-row">
                  {visibleColumns.select && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(featureSysId)}
                        onChange={(e) => handleRowSelect(featureSysId, e.target.checked)}
                      />
                    </td>
                  )}
                  {visibleColumns.number && (
                    <td>{getDisplayValue(feature.number)}</td>
                  )}
                  {visibleColumns.story_number && (
                    <td>{renderEditableCell(feature, 'story_number', feature.story_number)}</td>
                  )}
                  {visibleColumns.product && (
                    <td>
                      <div className="product-cell" style={{ borderLeft: `4px solid ${productConf.color}` }}>
                        <span className="product-indicator" style={{ color: productConf.color }}>
                          {productConf.icon}
                        </span>
                        {getDisplayValue(feature.product)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.short_description && (
                    <td>{renderEditableCell(feature, 'short_description', feature.short_description)}</td>
                  )}
                  {visibleColumns.developer && (
                    <td>{getDisplayValue(feature.developer)}</td>
                  )}
                  {visibleColumns.techlead && (
                    <td>{getDisplayValue(feature.techlead)}</td>
                  )}
                  {visibleColumns.uat_completed && (
                    <td>{renderEditableCell(feature, 'uat_completed', feature.uat_completed, 'boolean')}</td>
                  )}
                  {visibleColumns.deployment_type && (
                    <td>{getDisplayValue(feature.deployment_type)}</td>
                  )}
                  {visibleColumns.update_set_name && (
                    <td>{renderEditableCell(feature, 'update_set_name', feature.update_set_name)}</td>
                  )}
                  {visibleColumns.application_scope && (
                    <td>{getDisplayValue(feature.application_scope)}</td>
                  )}
                  {visibleColumns.out_of_update_set && (
                    <td>{renderEditableCell(feature, 'out_of_update_set', feature.out_of_update_set, 'boolean')}</td>
                  )}
                  {visibleColumns.deployment_sequence && (
                    <td>{renderEditableCell(feature, 'deployment_sequence', feature.deployment_sequence, 'number')}</td>
                  )}
                  {visibleColumns.estimated_duration && (
                    <td>{renderEditableCell(feature, 'estimated_duration', feature.estimated_duration, 'number')}</td>
                  )}
                  {visibleColumns.actual_duration && (
                    <td>{renderEditableCell(feature, 'actual_duration', feature.actual_duration, 'number')}</td>
                  )}
                  {visibleColumns.state && (
                    <td>
                      <div className="state-cell">
                        {getStateIcon(feature.state)}
                        {renderEditableCell(feature, 'state', feature.state, 'choice')}
                      </div>
                    </td>
                  )}
                  {visibleColumns.deployment_dependency && (
                    <td>{renderEditableCell(feature, 'deployment_dependency', feature.deployment_dependency)}</td>
                  )}
                  {visibleColumns.pre_deployment_activities && (
                    <td>{renderEditableCell(feature, 'pre_deployment_activities', feature.pre_deployment_activities)}</td>
                  )}
                  {visibleColumns.post_deployment_activities && (
                    <td>{renderEditableCell(feature, 'post_deployment_activities', feature.post_deployment_activities)}</td>
                  )}
                  {visibleColumns.review_comments && (
                    <td>{renderEditableCell(feature, 'review_comments', feature.review_comments)}</td>
                  )}
                  {visibleColumns.rollback_procedure && (
                    <td>{renderEditableCell(feature, 'rollback_procedure', feature.rollback_procedure)}</td>
                  )}
                  {visibleColumns.validation_steps && (
                    <td>{renderEditableCell(feature, 'validation_steps', feature.validation_steps)}</td>
                  )}
                  <td>
                    <div className="action-buttons">
                      <button
                        className="review-btn"
                        onClick={() => handleReviewClick(feature)}
                        title="Review feature"
                      >
                        👁️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => onDelete(featureSysId)}
                        title="Delete feature"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewFeatureModal />
      <ReviewModal />
    </div>
  );
}