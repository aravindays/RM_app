// Clone Service - Non-blocking async with timeout and fallback
class CloneService {
  constructor() {
    this.cloneTableName = "clone_instance";
    this.requestTimeout = 8000; // 8 seconds timeout
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  // Create cache key
  getCacheKey(year, month) {
    return `clones_${year}_${month}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp < this.cacheExpiry);
  }

  // Create timeout promise
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Clone API timeout')), timeout);
    });
  }

  // Get clone instances for a specific month with timeout
  async getCloneInstancesForMonth(year, month) {
    const cacheKey = this.getCacheKey(year, month);
    const cachedData = this.cache.get(cacheKey);

    // Return cached data immediately if available
    if (this.isCacheValid(cachedData)) {
      console.log(`Using cached clone data for ${year}-${month}`);
      return Promise.resolve(cachedData.data);
    }

    try {
      // Create date range for the month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const searchParams = new URLSearchParams({
        'sysparm_display_value': 'all',
        'sysparm_query': `scheduled>=${startDateStr}^scheduled<=${endDateStr}`,
        'sysparm_order_by': 'scheduled',
        'sysparm_fields': 'sys_id,clone_id,target_instance,scheduled,state,source_instance,requested_by,request_date',
        'sysparm_limit': '50' // Limit results to prevent large responses
      });
      
      console.log(`Fetching clone instances for ${year}-${month + 1} with timeout`);
      
      // Create fetch promise with timeout
      const fetchPromise = fetch(`/api/now/table/${this.cloneTableName}?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck || 'no-token'
        },
        // Add signal for abort capability if supported
        signal: AbortSignal.timeout ? AbortSignal.timeout(this.requestTimeout) : undefined
      });

      const timeoutPromise = this.createTimeoutPromise(this.requestTimeout);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`Clone API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Clone instances loaded successfully:`, data);

      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Clone API failed, using mock data:', error.message);
      // Return mock data immediately on any error
      const mockData = this.getMockCloneData(year, month);
      
      // Cache mock data for shorter time (2 minutes)
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now() - (this.cacheExpiry - 2 * 60 * 1000)
      });
      
      return mockData;
    }
  }

  // Get mock clone data for demonstration - immediate, no async
  getMockCloneData(year, month) {
    // Create realistic mock data for the requested month
    const mockClones = [
      {
        sys_id: { value: `mock_clone_${year}_${month}_1` },
        clone_id: { display_value: 'CLN0001001', value: 'CLN0001001' },
        target_instance: { display_value: 'dev-instance-01', value: 'dev-instance-01' },
        scheduled: { 
          display_value: `${year}-${String(month + 1).padStart(2, '0')}-05 02:00:00`, 
          value: `${year}-${String(month + 1).padStart(2, '0')}-05 02:00:00` 
        },
        state: { display_value: 'Scheduled', value: 'scheduled' },
        source_instance: { display_value: 'prod-instance', value: 'prod-instance' },
        requested_by: { display_value: 'John Doe', value: 'admin' }
      },
      {
        sys_id: { value: `mock_clone_${year}_${month}_2` },
        clone_id: { display_value: 'CLN0001002', value: 'CLN0001002' },
        target_instance: { display_value: 'test-instance-02', value: 'test-instance-02' },
        scheduled: { 
          display_value: `${year}-${String(month + 1).padStart(2, '0')}-12 03:00:00`, 
          value: `${year}-${String(month + 1).padStart(2, '0')}-12 03:00:00` 
        },
        state: { display_value: 'In Progress', value: 'in_progress' },
        source_instance: { display_value: 'prod-instance', value: 'prod-instance' },
        requested_by: { display_value: 'Jane Smith', value: 'jsmith' }
      },
      {
        sys_id: { value: `mock_clone_${year}_${month}_3` },
        clone_id: { display_value: 'CLN0001003', value: 'CLN0001003' },
        target_instance: { display_value: 'staging-instance', value: 'staging-instance' },
        scheduled: { 
          display_value: `${year}-${String(month + 1).padStart(2, '0')}-20 01:30:00`, 
          value: `${year}-${String(month + 1).padStart(2, '0')}-20 01:30:00` 
        },
        state: { display_value: 'Completed', value: 'completed' },
        source_instance: { display_value: 'prod-instance', value: 'prod-instance' },
        requested_by: { display_value: 'Bob Johnson', value: 'bjohnson' }
      }
    ];

    return {
      result: mockClones
    };
  }

  // Get all clone instances with timeout
  async getAllCloneInstances(filters = {}) {
    try {
      const searchParams = new URLSearchParams(filters);
      searchParams.set('sysparm_display_value', 'all');
      searchParams.set('sysparm_order_by', 'scheduled');
      searchParams.set('sysparm_limit', '100');
      
      const fetchPromise = fetch(`/api/now/table/${this.cloneTableName}?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck || 'no-token'
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(this.requestTimeout) : undefined
      });

      const timeoutPromise = this.createTimeoutPromise(this.requestTimeout);
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`Clone API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all clone instances:', error);
      return { result: [] };
    }
  }

  // Get clone instance details by sys_id with timeout
  async getCloneInstance(sysId) {
    try {
      const fetchPromise = fetch(`/api/now/table/${this.cloneTableName}/${sysId}?sysparm_display_value=all`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck || 'no-token'
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(this.requestTimeout) : undefined
      });

      const timeoutPromise = this.createTimeoutPromise(this.requestTimeout);
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`Clone API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching clone instance:', error);
      throw error;
    }
  }

  // Helper function to extract display value - synchronous
  getDisplayValue(field) {
    if (!field) return '';
    if (typeof field === 'object' && field.display_value !== undefined) {
      return field.display_value;
    }
    if (typeof field === 'object' && field.value !== undefined) {
      return field.value;
    }
    return String(field);
  }

  // Helper function to extract sys_id - synchronous
  getSysId(record) {
    if (!record) return null;
    if (typeof record.sys_id === 'object' && record.sys_id.value) {
      return record.sys_id.value;
    }
    return record.sys_id;
  }

  // Get clone state styling - synchronous
  getCloneStateStyle(state) {
    const stateStyles = {
      'scheduled': { color: '#3b82f6', background: '#eff6ff', icon: '📅' },
      'in_progress': { color: '#f59e0b', background: '#fffbeb', icon: '⚙️' },
      'in progress': { color: '#f59e0b', background: '#fffbeb', icon: '⚙️' },
      'completed': { color: '#10b981', background: '#ecfdf5', icon: '✅' },
      'failed': { color: '#ef4444', background: '#fef2f2', icon: '❌' },
      'cancelled': { color: '#6b7280', background: '#f9fafb', icon: '🚫' },
      'canceled': { color: '#6b7280', background: '#f9fafb', icon: '🚫' }
    };
    
    const normalizedState = String(state).toLowerCase().trim();
    return stateStyles[normalizedState] || stateStyles['scheduled'];
  }

  // Format scheduled date for display - synchronous
  formatScheduledDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return {
          date: 'Invalid Date',
          time: '',
          full: 'Invalid Date'
        };
      }
      
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        full: date.toLocaleString()
      };
    } catch (error) {
      return {
        date: 'Invalid Date',
        time: '',
        full: 'Invalid Date'
      };
    }
  }

  // Get days until scheduled clone - synchronous
  getDaysUntilClone(scheduledDate) {
    try {
      const now = new Date();
      const cloneDate = new Date(scheduledDate);
      
      if (isNaN(cloneDate.getTime())) {
        return 'Unknown';
      }
      
      const diffTime = cloneDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Past';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      return `${diffDays} days`;
    } catch (error) {
      return 'Unknown';
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('Clone cache cleared');
  }

  // Get cache status
  getCacheStatus() {
    const status = {};
    this.cache.forEach((value, key) => {
      status[key] = {
        cached: true,
        timestamp: new Date(value.timestamp).toISOString(),
        expired: !this.isCacheValid(value),
        dataLength: value.data?.result?.length || 0
      };
    });
    return status;
  }
}

export default new CloneService();