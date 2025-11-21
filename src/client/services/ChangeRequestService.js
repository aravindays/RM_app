// Change Request Service - Manages change request data and operations
class ChangeRequestService {
  constructor() {
    this.changeRequestTableName = "change_request";
    this.requestTimeout = 8000; // 8 seconds timeout
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  // Create cache key
  getCacheKey(releaseSysId, year, month) {
    return `change_requests_${releaseSysId}_${year}_${month}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp < this.cacheExpiry);
  }

  // Create timeout promise
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Change Request API timeout')), timeout);
    });
  }

  // Get change requests for a release and specific month
  async getChangeRequestsForRelease(releaseSysId, year, month) {
    const cacheKey = this.getCacheKey(releaseSysId, year, month);
    const cachedData = this.cache.get(cacheKey);

    // Return cached data immediately if available
    if (this.isCacheValid(cachedData)) {
      console.log(`Using cached change request data for release ${releaseSysId}`);
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
        'sysparm_query': `u_application_release=${releaseSysId}^sys_created_on>=${startDateStr}^sys_created_on<=${endDateStr}`,
        'sysparm_order_by': 'sys_created_on',
        'sysparm_fields': 'sys_id,number,cmdb_ci,state,approval,short_description,priority,risk,impact,category,assigned_to,sys_created_on,sys_updated_on',
        'sysparm_limit': '50' // Limit results to prevent large responses
      });
      
      console.log(`Fetching change requests for release ${releaseSysId} and month ${year}-${month + 1}`);
      
      // Create fetch promise with timeout
      const fetchPromise = fetch(`/api/now/table/${this.changeRequestTableName}?${searchParams.toString()}`, {
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
        throw new Error(`Change Request API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Change requests loaded successfully:`, data);

      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.warn('Change Request API failed, using mock data:', error.message);
      // Return mock data immediately on any error
      const mockData = this.getMockChangeRequestData(releaseSysId, year, month);
      
      // Cache mock data for shorter time (2 minutes)
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now() - (this.cacheExpiry - 2 * 60 * 1000)
      });
      
      return mockData;
    }
  }

  // Get mock change request data for demonstration
  getMockChangeRequestData(releaseSysId, year, month) {
    const mockChangeRequests = [
      {
        sys_id: { value: `mock_cr_${releaseSysId}_${month}_1` },
        number: { display_value: 'CHG0030001', value: 'CHG0030001' },
        cmdb_ci: { display_value: 'Production Server 01', value: 'prod_server_01', link: '/cmdb_ci.do?sys_id=prod_server_01' },
        state: { display_value: 'Scheduled', value: '1' },
        approval: { display_value: 'Approved', value: 'approved' },
        short_description: { display_value: 'Deploy release features to production environment', value: 'Deploy release features to production environment' },
        priority: { display_value: '2 - High', value: '2' },
        risk: { display_value: 'Medium', value: 'medium' },
        impact: { display_value: '2 - Medium', value: '2' },
        category: { display_value: 'Software', value: 'software' },
        assigned_to: { display_value: 'John Doe', value: 'admin' },
        sys_created_on: { display_value: `${year}-${String(month + 1).padStart(2, '0')}-05 10:30:00`, value: `${year}-${String(month + 1).padStart(2, '0')}-05 10:30:00` }
      },
      {
        sys_id: { value: `mock_cr_${releaseSysId}_${month}_2` },
        number: { display_value: 'CHG0030002', value: 'CHG0030002' },
        cmdb_ci: { display_value: 'Application Load Balancer', value: 'app_lb_01', link: '/cmdb_ci.do?sys_id=app_lb_01' },
        state: { display_value: 'In Progress', value: '2' },
        approval: { display_value: 'Requested', value: 'requested' },
        short_description: { display_value: 'Update load balancer configuration for new release', value: 'Update load balancer configuration for new release' },
        priority: { display_value: '3 - Moderate', value: '3' },
        risk: { display_value: 'Low', value: 'low' },
        impact: { display_value: '3 - Low', value: '3' },
        category: { display_value: 'Network', value: 'network' },
        assigned_to: { display_value: 'Jane Smith', value: 'jsmith' },
        sys_created_on: { display_value: `${year}-${String(month + 1).padStart(2, '0')}-12 14:15:00`, value: `${year}-${String(month + 1).padStart(2, '0')}-12 14:15:00` }
      },
      {
        sys_id: { value: `mock_cr_${releaseSysId}_${month}_3` },
        number: { display_value: 'CHG0030003', value: 'CHG0030003' },
        cmdb_ci: { display_value: 'Database Cluster', value: 'db_cluster_01', link: '/cmdb_ci.do?sys_id=db_cluster_01' },
        state: { display_value: 'Review', value: '-1' },
        approval: { display_value: 'Not Requested', value: 'not requested' },
        short_description: { display_value: 'Database schema updates for feature rollout', value: 'Database schema updates for feature rollout' },
        priority: { display_value: '2 - High', value: '2' },
        risk: { display_value: 'High', value: 'high' },
        impact: { display_value: '1 - High', value: '1' },
        category: { display_value: 'Software', value: 'software' },
        assigned_to: { display_value: 'Bob Johnson', value: 'bjohnson' },
        sys_created_on: { display_value: `${year}-${String(month + 1).padStart(2, '0')}-18 09:45:00`, value: `${year}-${String(month + 1).padStart(2, '0')}-18 09:45:00` }
      }
    ];

    return {
      result: mockChangeRequests
    };
  }

  // Create new change request - opens ServiceNow form in new tab
  createChangeRequest(releaseSysId) {
    try {
      // Create URL with pre-populated release field
      const url = `/change_request.do?sys_id=-1&sysparm_stack=change_request_list.do&u_application_release=${releaseSysId}`;
      
      console.log('Opening new change request form:', url);
      
      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      
      return true;
    } catch (error) {
      console.error('Error opening change request form:', error);
      return false;
    }
  }

  // Get all change requests for a release (without month filter)
  async getAllChangeRequestsForRelease(releaseSysId) {
    try {
      const searchParams = new URLSearchParams({
        'sysparm_display_value': 'all',
        'sysparm_query': `u_application_release=${releaseSysId}`,
        'sysparm_order_by': 'sys_created_on',
        'sysparm_fields': 'sys_id,number,cmdb_ci,state,approval,short_description,priority,risk,impact',
        'sysparm_limit': '100'
      });
      
      const fetchPromise = fetch(`/api/now/table/${this.changeRequestTableName}?${searchParams.toString()}`, {
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
        throw new Error(`Change Request API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all change requests for release:', error);
      return { result: [] };
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

  // Get change request state styling - synchronous
  getChangeRequestStateStyle(state) {
    const stateStyles = {
      'new': { color: '#6b7280', background: '#f9fafb', icon: '📋' },
      'assess': { color: '#3b82f6', background: '#eff6ff', icon: '🔍' },
      'authorize': { color: '#f59e0b', background: '#fffbeb', icon: '✋' },
      'scheduled': { color: '#8b5cf6', background: '#f3e8ff', icon: '📅' },
      'implement': { color: '#06b6d4', background: '#ecfeff', icon: '⚙️' },
      'review': { color: '#ec4899', background: '#fdf2f8', icon: '👁️' },
      'closed': { color: '#10b981', background: '#ecfdf5', icon: '✅' },
      'cancelled': { color: '#ef4444', background: '#fef2f2', icon: '❌' }
    };
    
    const normalizedState = String(state).toLowerCase().trim();
    return stateStyles[normalizedState] || stateStyles['new'];
  }

  // Get approval styling
  getApprovalStyle(approval) {
    const approvalStyles = {
      'approved': { color: '#10b981', background: '#ecfdf5', icon: '✅' },
      'rejected': { color: '#ef4444', background: '#fef2f2', icon: '❌' },
      'requested': { color: '#f59e0b', background: '#fffbeb', icon: '⏳' },
      'not requested': { color: '#6b7280', background: '#f9fafb', icon: '➖' }
    };
    
    const normalizedApproval = String(approval).toLowerCase().trim();
    return approvalStyles[normalizedApproval] || approvalStyles['not requested'];
  }

  // Format created date for display - synchronous
  formatCreatedDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('Change Request cache cleared');
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

export default new ChangeRequestService();