# Release Management Center - Debugging Guide

## Table of Contents
1. [Common Issues & Solutions](#common-issues--solutions)
2. [Debugging Tools & Techniques](#debugging-tools--techniques)
3. [Error Analysis](#error-analysis)
4. [Performance Debugging](#performance-debugging)
5. [Integration Debugging](#integration-debugging)
6. [Browser-Specific Issues](#browser-specific-issues)
7. [ServiceNow Platform Issues](#servicenow-platform-issues)
8. [Logging & Monitoring](#logging--monitoring)
9. [Troubleshooting Workflows](#troubleshooting-workflows)

## Common Issues & Solutions

### 1. Page Loading Issues

#### Blank Page or Infinite Loading

**Symptoms:**
- Application shows blank screen
- Loading indicators never complete
- Browser shows "Page Unresponsive" alert

**Root Causes & Solutions:**

```javascript
// Issue: Synchronous API calls blocking UI thread
// Problem Code:
const loadData = async () => {
  const holidays = await HolidayService.getHolidays(); // Blocks UI
  const clones = await CloneService.getClones();       // Blocks UI
};

// Solution: Asynchronous with timeout
const loadData = async () => {
  const promises = [
    Promise.race([
      HolidayService.getHolidays(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]),
    CloneService.getClones()
  ];
  
  const results = await Promise.allSettled(promises);
  // Handle results with fallback data
};
```

**Debug Steps:**
1. Open Browser DevTools (F12)
2. Check Console for JavaScript errors
3. Monitor Network tab for hanging requests
4. Check React DevTools for component errors

#### Calendar Not Displaying

**Symptoms:**
- Calendar section is empty
- Release events not showing

**Common Causes:**
```javascript
// Issue: Incorrect date parsing
const releaseDate = new Date(release.work_start); // May fail with objects

// Solution: Safe date extraction
const getSafeDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'object' && dateValue.value) {
    return new Date(dateValue.value);
  }
  return new Date(dateValue);
};
```

**Debug Commands:**
```javascript
// Console debugging
console.log('Releases:', releases);
console.log('Current Date:', currentDate);
console.log('Calendar Days:', getCalendarData());
```

### 2. Data Loading Issues

#### Features Not Loading

**Symptoms:**
- Release features section shows "No features available"
- Selected release has features but they don't display

**Debug Process:**
```javascript
// 1. Verify release selection
console.log('Selected Release:', selectedRelease);
console.log('Release Sys ID:', getSysId(selectedRelease));

// 2. Check API call
const features = await ReleaseService.getReleaseFeatures(releaseSysId);
console.log('API Response:', features);

// 3. Verify data structure
features.forEach((feature, index) => {
  console.log(`Feature ${index}:`, {
    sys_id: getSysId(feature),
    story_number: getDisplayValue(feature.story_number),
    product: feature.product?.value || feature.product
  });
});
```

#### Holiday Data Missing

**Symptoms:**
- Holiday section shows "Loading..." indefinitely
- Holidays display for some countries but not others

**Debugging Steps:**
```javascript
// Test holiday service directly
const holidayService = new HolidayService();

// Test individual country
const testCountry = async (country) => {
  try {
    const holidays = await holidayService.getHolidaysForCountry(2026, 1, country);
    console.log(`${country} holidays:`, holidays);
  } catch (error) {
    console.error(`${country} failed:`, error);
  }
};

await testCountry('US');
await testCountry('IN');
await testCountry('SG');
```

### 3. Inline Editing Issues

#### Edits Not Saving

**Symptoms:**
- Cell shows saving spinner indefinitely
- Changes revert after editing
- Error messages in console

**Debug Process:**
```javascript
// 1. Verify API call structure
const updatePayload = {
  [fieldName]: newValue
};
console.log('Update Payload:', updatePayload);

// 2. Check API response
try {
  const response = await ReleaseService.updateReleaseFeature(sysId, updatePayload);
  console.log('Update Response:', response);
} catch (error) {
  console.error('Update Error:', error);
}

// 3. Verify field permissions
// Check ServiceNow ACLs for the field
```

#### Type Conversion Errors

**Symptoms:**
- Boolean fields showing as strings
- Date fields not formatting correctly

**Solution:**
```javascript
// Safe type conversion
const convertFieldValue = (fieldName, value, fieldType) => {
  switch (fieldType) {
    case 'boolean':
      return value === 'true' || value === true;
    case 'integer':
      return parseInt(value, 10);
    case 'date':
      return value ? new Date(value).toISOString().split('T')[0] : '';
    default:
      return String(value || '');
  }
};
```

### 4. Modal Issues

#### Modal Not Opening

**Symptoms:**
- Buttons don't trigger modals
- Modal backdrop appears but content is missing

**Debug Steps:**
```javascript
// 1. Check modal state
console.log('Modal State:', {
  showNewFeatureModal,
  showReviewModal,
  showNoteModal
});

// 2. Verify event handlers
const handleNewFeatureClick = () => {
  console.log('New Feature clicked');
  setShowNewFeatureModal(true);
};

// 3. Check modal component props
<NewFeatureModal
  show={showNewFeatureModal}
  onClose={() => setShowNewFeatureModal(false)}
  onSave={handleSaveNewFeature}
  selectedRelease={selectedRelease}
/>
```

## Debugging Tools & Techniques

### Browser Developer Tools

#### Console Debugging
```javascript
// Enable detailed logging
window.DEBUG_RELEASE_APP = true;

// Debug helper functions
window.debugReleaseApp = {
  logState: () => console.log('App State:', {
    releases,
    selectedRelease,
    currentMonth,
    loading
  }),
  
  testAPI: async (endpoint) => {
    try {
      const response = await fetch(endpoint);
      console.log('API Test:', response);
    } catch (error) {
      console.error('API Error:', error);
    }
  },
  
  clearCache: () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Cache cleared');
  }
};
```

#### Network Tab Analysis
```javascript
// Monitor API calls
// 1. Open DevTools > Network tab
// 2. Filter by XHR/Fetch
// 3. Look for:
//    - Status codes (200, 404, 500)
//    - Response times
//    - Request/response headers
//    - Payload data
```

#### React Developer Tools
```javascript
// Install React DevTools extension
// Features:
// 1. Component hierarchy inspection
// 2. Props and state debugging
// 3. Performance profiling
// 4. Hook debugging
```

### ServiceNow Debugging

#### System Logs
```javascript
// Enable system logging
// Navigate to: System Logs > System Log > All
// Filter by: source contains "x_7767_release_man"

// Application logs location:
// - Business Rule logs
// - Script Include logs  
// - UI Page errors
// - API call errors
```

#### Database Queries
```sql
-- Verify table data
SELECT sys_id, number, story_number, product, state 
FROM x_7767_release_man_release_features 
WHERE release = '[release_sys_id]'
ORDER BY deployment_sequence;

-- Check change request extension
SELECT sys_id, number, u_application_release, state
FROM change_request
WHERE u_application_release IS NOT NULL;

-- Verify release data
SELECT sys_id, number, short_description, work_start, work_end, state
FROM rm_release
WHERE work_start >= '2026-01-01'
ORDER BY work_start;
```

## Error Analysis

### JavaScript Errors

#### Reference Errors
```javascript
// Error: "Cannot access 'getSysId' before initialization"
// Cause: Function hoisting issue

// Problem:
const productCounts = useMemo(() => {
  // getSysId used here but defined later
  return calculateCounts(getSysId);
}, []);

const getSysId = (record) => { /* implementation */ };

// Solution: Move function definition before usage
const getSysId = (record) => {
  return typeof record?.sys_id === 'object' ? 
    record.sys_id.value : record.sys_id;
};

const productCounts = useMemo(() => {
  return calculateCounts(getSysId);
}, []);
```

#### Type Errors
```javascript
// Error: "Cannot read property 'value' of undefined"
// Cause: Undefined object property access

// Problem:
const releaseId = selectedRelease.sys_id.value;

// Solution: Safe property access
const releaseId = selectedRelease?.sys_id?.value || 
                 selectedRelease?.sys_id || 
                 null;
```

#### Async Errors
```javascript
// Error: "Promise rejected" or infinite loading
// Cause: Unhandled promise rejection

// Problem:
const loadData = async () => {
  const data = await API.getData(); // May fail
  setState(data);
};

// Solution: Proper error handling
const loadData = async () => {
  try {
    const data = await API.getData();
    setState(data);
    setError(null);
  } catch (error) {
    console.error('Data loading failed:', error);
    setError('Failed to load data');
    setState(fallbackData);
  }
};
```

### API Errors

#### 401 Unauthorized
```javascript
// Cause: Invalid or expired session token
// Solution: 
const checkAuth = () => {
  if (!window.g_ck) {
    window.location.reload(); // Refresh to get new token
    return false;
  }
  return true;
};

// Use before API calls
if (!checkAuth()) return;
```

#### 403 Forbidden
```javascript
// Cause: Insufficient permissions
// Debug: Check ACLs and user roles
// Solution: Verify user has proper role assignments
```

#### 500 Internal Server Error
```javascript
// Cause: Server-side error
// Debug: Check ServiceNow system logs
// Solution: Review business rules and script includes
```

## Performance Debugging

### Performance Profiler

#### React Performance
```javascript
// Use React DevTools Profiler
// 1. Open React DevTools
// 2. Click Profiler tab
// 3. Click Record
// 4. Perform actions
// 5. Stop recording
// 6. Analyze render times

// Identify slow components
const SlowComponent = React.memo(({ data }) => {
  // Expensive computation
  const result = useMemo(() => {
    return heavyCalculation(data);
  }, [data]);
  
  return <div>{result}</div>;
});
```

#### Network Performance
```javascript
// Monitor API call performance
const performanceLog = {
  startTime: Date.now(),
  
  logAPICall: (name, startTime) => {
    const duration = Date.now() - startTime;
    console.log(`API Call ${name}: ${duration}ms`);
    
    if (duration > 2000) {
      console.warn(`Slow API call detected: ${name}`);
    }
  }
};

// Usage
const start = Date.now();
const data = await API.getData();
performanceLog.logAPICall('getData', start);
```

### Memory Debugging

#### Memory Leaks
```javascript
// Common memory leak: Event listeners not cleaned up
useEffect(() => {
  const handleResize = () => setWindowSize(window.innerWidth);
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// Memory leak: Timers not cleared
useEffect(() => {
  const timer = setInterval(() => {
    checkForUpdates();
  }, 30000);
  
  // Cleanup
  return () => clearInterval(timer);
}, []);
```

## Integration Debugging

### External API Issues

#### Holiday API Debugging
```javascript
// Test holiday API directly
const testHolidayAPI = async () => {
  const countries = ['US', 'IN', 'SG'];
  
  for (const country of countries) {
    try {
      const url = `https://date.nager.at/api/v3/PublicHolidays/2026/${country}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`${country} holidays:`, data.length);
    } catch (error) {
      console.error(`${country} API failed:`, error);
    }
  }
};
```

#### ServiceNow API Debugging
```javascript
// Debug ServiceNow API calls
const debugAPI = {
  logRequest: (url, options) => {
    console.group('API Request');
    console.log('URL:', url);
    console.log('Method:', options.method);
    console.log('Headers:', options.headers);
    console.log('Body:', options.body);
    console.groupEnd();
  },
  
  logResponse: (response, data) => {
    console.group('API Response');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', data);
    console.groupEnd();
  }
};

// Use in service calls
const response = await fetch(url, options);
debugAPI.logResponse(response, await response.json());
```

## Browser-Specific Issues

### Safari Compatibility

#### Function Hoisting
```javascript
// Safari strict about function hoisting
// Problem: const functions not hoisted
const myFunction = () => { /* ... */ };

// Solution: Use function declarations for hoisting
function myFunction() { /* ... */ }

// Or ensure proper order
const helper1 = () => { /* ... */ };
const helper2 = () => { /* ... */ };
const mainFunction = () => {
  helper1();
  helper2();
};
```

#### Date Parsing
```javascript
// Safari strict about date formats
// Problem: Safari may reject certain date strings
new Date('2026-01-01 10:00:00'); // May fail in Safari

// Solution: Use ISO format or explicit parsing
new Date('2026-01-01T10:00:00.000Z'); // ISO format
// or
new Date(2026, 0, 1, 10, 0, 0); // Explicit constructor
```

### Chrome-Specific Issues

#### Memory Limits
```javascript
// Chrome has strict memory limits for tabs
// Solution: Implement data pagination and cleanup
const cleanupOldData = () => {
  // Remove data older than 24 hours from cache
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  
  for (const [key, value] of cache.entries()) {
    if (value.timestamp < cutoff) {
      cache.delete(key);
    }
  }
};
```

## ServiceNow Platform Issues

### ACL Problems

#### Debugging Access Controls
```javascript
// Check user permissions programmatically
const checkPermissions = {
  table: (tableName) => {
    const gr = new GlideRecord(tableName);
    console.log('Can Read:', gr.canRead());
    console.log('Can Write:', gr.canWrite());
    console.log('Can Create:', gr.canCreate());
    console.log('Can Delete:', gr.canDelete());
  },
  
  field: (tableName, fieldName) => {
    const gr = new GlideRecord(tableName);
    const element = gr.getElement(fieldName);
    console.log('Can Read Field:', element.canRead());
    console.log('Can Write Field:', element.canWrite());
  }
};

// Usage in browser console (if admin)
// checkPermissions.table('x_7767_release_man_release_features');
```

### Business Rule Issues

#### Debug Business Rules
```javascript
// Add logging to business rules
(function executeRule(current, previous /*null when async*/) {
  
  try {
    gs.log('Business Rule Start: ' + current.getTableName() + 
           ' - ' + current.getUniqueValue());
    
    // Your business rule logic here
    
    gs.log('Business Rule End: Success');
    
  } catch (error) {
    gs.error('Business Rule Error: ' + error.toString());
  }
  
})(current, previous);
```

## Logging & Monitoring

### Application Logging

#### Client-Side Logging
```javascript
// Centralized logging system
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }
  
  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output
    console[level](message, data);
    
    // Optional: Send to server
    if (level === 'error') {
      this.sendToServer(entry);
    }
  }
  
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], 
                         { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'release-app-logs.json';
    a.click();
  }
}

// Global logger instance
window.appLogger = new Logger();
```

#### Server-Side Logging
```javascript
// ServiceNow system log integration
const logToServiceNow = (level, message, source = 'Release App') => {
  gs.log(message, source);
  
  // For errors, also log to system error table
  if (level === 'error') {
    gs.error(message, source);
  }
};
```

### Performance Monitoring

#### Custom Performance Metrics
```javascript
// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }
  
  start(name) {
    this.metrics.set(name, { start: performance.now() });
  }
  
  end(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.duration = performance.now() - metric.start;
      metric.end = performance.now();
      
      if (metric.duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${metric.duration}ms`);
      }
    }
  }
  
  getReport() {
    const report = {};
    for (const [name, metric] of this.metrics) {
      if (metric.duration) {
        report[name] = metric.duration;
      }
    }
    return report;
  }
}

// Usage
const monitor = new PerformanceMonitor();
monitor.start('loadReleases');
await loadReleases();
monitor.end('loadReleases');
```

## Troubleshooting Workflows

### Issue Resolution Process

#### 1. Issue Identification
```
User Reports Issue
       ↓
Reproduce Issue
       ↓
Gather Information
├── Browser/version
├── User permissions  
├── Steps to reproduce
├── Error messages
└── Expected vs actual behavior
```

#### 2. Initial Debugging
```
Check Browser Console
       ↓
Review Network Requests
       ↓
Verify ServiceNow Logs
       ↓
Test with Different User
       ↓
Test in Different Browser
```

#### 3. Deep Debugging
```javascript
// Create debugging session
const debugSession = {
  sessionId: Date.now(),
  user: getCurrentUser(),
  browser: navigator.userAgent,
  issue: 'Description of issue',
  
  steps: [],
  
  addStep(action, result) {
    this.steps.push({
      timestamp: Date.now(),
      action,
      result
    });
  },
  
  exportSession() {
    console.log('Debug Session:', this);
    return JSON.stringify(this, null, 2);
  }
};

// Use during debugging
debugSession.addStep('Load releases', releases.length + ' releases loaded');
debugSession.addStep('Select release', 'Release selected: ' + selectedRelease?.number);
```

### Common Resolution Patterns

#### Pattern 1: Data Not Loading
```
1. Check API endpoint URL
2. Verify authentication token
3. Check user permissions
4. Verify table existence
5. Check network connectivity
6. Review API response format
7. Validate data parsing logic
```

#### Pattern 2: UI Not Updating
```
1. Verify state management
2. Check component re-rendering
3. Validate prop passing
4. Review useEffect dependencies
5. Check event handler binding
6. Verify conditional rendering logic
```

#### Pattern 3: Performance Issues
```
1. Profile component rendering
2. Analyze API call frequency
3. Review memory usage
4. Check for memory leaks
5. Optimize expensive operations
6. Implement proper caching
```

### Emergency Procedures

#### Application Down
```javascript
// Emergency fallback mode
const EMERGENCY_MODE = {
  enabled: false,
  
  activate() {
    this.enabled = true;
    console.warn('Emergency mode activated');
    
    // Disable non-critical features
    // Show static data
    // Provide basic functionality
  },
  
  isActive() {
    return this.enabled;
  }
};

// Use in components
if (EMERGENCY_MODE.isActive()) {
  return <EmergencyModeComponent />;
}
```

#### Data Corruption
```javascript
// Data validation and recovery
const validateData = (data) => {
  const issues = [];
  
  // Check required fields
  if (!data.sys_id) issues.push('Missing sys_id');
  if (!data.number) issues.push('Missing number');
  
  // Check data types
  if (typeof data.uat_completed !== 'boolean') {
    issues.push('Invalid uat_completed type');
  }
  
  return issues;
};

const recoverData = async (corruptedData) => {
  // Attempt to recover from backup
  // Validate recovered data
  // Merge with current data
  // Log recovery process
};
```

---

*This debugging guide provides comprehensive troubleshooting information for the Release Management Center. Keep it updated as new issues and solutions are discovered.*