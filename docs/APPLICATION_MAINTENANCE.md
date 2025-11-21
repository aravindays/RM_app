# Release Management Center - Application Maintenance Guide

## Table of Contents
1. [Overview](#overview)
2. [ServiceNow Administrator Responsibilities](#servicenow-administrator-responsibilities)
3. [ServiceNow Developer Responsibilities](#servicenow-developer-responsibilities)
4. [Routine Maintenance Tasks](#routine-maintenance-tasks)
5. [Data Management](#data-management)
6. [Performance Monitoring](#performance-monitoring)
7. [Security Maintenance](#security-maintenance)
8. [Backup & Recovery](#backup--recovery)
9. [Upgrade Procedures](#upgrade-procedures)
10. [Troubleshooting & Support](#troubleshooting--support)
11. [Best Practices](#best-practices)

## Overview

The Release Management Center is a complex ServiceNow application that requires ongoing maintenance to ensure optimal performance, security, and reliability. This guide outlines the responsibilities and procedures for ServiceNow administrators and developers.

### Application Components
- **Custom Tables**: Release Features, Change Request Extensions
- **UI Components**: React-based portal pages, custom styling
- **External Integrations**: Holiday APIs, external data sources
- **Service Layer**: Multiple JavaScript services with caching
- **Data Relationships**: Complex relationships between releases, features, and change requests

### Maintenance Philosophy
1. **Proactive Monitoring**: Identify issues before they impact users
2. **Regular Updates**: Keep components current and secure
3. **Performance Optimization**: Maintain fast response times
4. **Data Integrity**: Ensure accurate and consistent data
5. **User Experience**: Prioritize smooth, intuitive operations

## ServiceNow Administrator Responsibilities

### Daily Tasks

#### System Health Monitoring
```sql
-- Check application table sizes
SELECT 
    sys_db_object.name as table_name,
    sys_db_object.super_class.name as extends_table,
    (SELECT COUNT(*) FROM [table_name]) as record_count
FROM sys_db_object 
WHERE sys_scope.scope = 'x_7767_release_man'
ORDER BY record_count DESC;
```

#### User Access Management
- Monitor user login patterns and access attempts
- Review and update role assignments
- Validate ACL configurations
- Check for unusual data access patterns

#### Performance Monitoring
```javascript
// Check slow-running queries related to the app
// Navigate to: System Diagnostics > Stats > Slow Queries
// Filter by: table contains "x_7767_release_man"

// Monitor Memory Usage
// Navigate to: System Diagnostics > Stats > Memory
// Look for: High memory usage during peak hours
```

### Weekly Tasks

#### Data Quality Audits
```sql
-- Check for orphaned release features
SELECT rf.sys_id, rf.number, rf.story_number
FROM x_7767_release_man_release_features rf
LEFT JOIN rm_release r ON rf.release = r.sys_id
WHERE r.sys_id IS NULL;

-- Validate release date consistency
SELECT sys_id, number, work_start, work_end
FROM rm_release
WHERE work_start > work_end
   OR work_start IS NULL
   OR work_end IS NULL;

-- Check for duplicate story numbers
SELECT story_number, COUNT(*)
FROM x_7767_release_man_release_features
GROUP BY story_number
HAVING COUNT(*) > 1;
```

#### User Permission Audits
- Review user roles and group memberships
- Validate ACL effectiveness
- Check for excessive permissions
- Monitor privileged user activities

#### System Log Review
```javascript
// Check for application errors
// Navigate to: System Logs > System Log > All
// Filter by: 
//   - Source contains "x_7767_release_man"
//   - Level = "Error" or "Warning"
//   - Created in last 7 days

// Common issues to look for:
// 1. API timeout errors
// 2. Data validation failures
// 3. Permission denied errors
// 4. External service failures
```

### Monthly Tasks

#### Performance Analysis
```sql
-- Analyze table growth trends
SELECT 
    table_name,
    MONTH(sys_created_on) as month,
    COUNT(*) as records_created
FROM x_7767_release_man_release_features
WHERE sys_created_on >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
GROUP BY table_name, MONTH(sys_created_on)
ORDER BY table_name, month;
```

#### Security Review
- Update application security policies
- Review and rotate API keys (if applicable)
- Validate external integration security
- Conduct user access reviews

#### Backup Verification
- Verify automatic backup procedures
- Test data restoration processes
- Validate backup integrity
- Update disaster recovery documentation

### Quarterly Tasks

#### Comprehensive Health Check
```javascript
// Application Health Dashboard
// Create custom dashboard monitoring:
// 1. Table record counts and growth rates
// 2. API response times and error rates  
// 3. User activity patterns
// 4. External service availability
// 5. Cache hit/miss ratios
```

#### Capacity Planning
- Analyze storage usage trends
- Project future resource requirements
- Plan for peak usage periods
- Optimize database indexes

#### Documentation Updates
- Update user guides based on changes
- Review and update troubleshooting procedures
- Validate emergency procedures
- Update contact information

## ServiceNow Developer Responsibilities

### Code Maintenance

#### Weekly Code Reviews
```javascript
// Check for deprecated API usage
// Review client-side console warnings
// Validate error handling completeness
// Monitor external API changes

// Example: Holiday API health check
const validateExternalAPIs = async () => {
  const apis = [
    'https://date.nager.at/api/v3/AvailableCountries',
    'https://date.nager.at/api/v3/PublicHolidays/2026/US'
  ];
  
  for (const api of apis) {
    try {
      const response = await fetch(api);
      console.log(`${api}: ${response.status}`);
    } catch (error) {
      console.error(`${api}: Failed - ${error.message}`);
    }
  }
};
```

#### Component Updates
```javascript
// Monitor React component performance
// Use React DevTools Profiler monthly
// Look for:
// 1. Components with high render times
// 2. Unnecessary re-renders
// 3. Memory leaks in useEffect hooks
// 4. Prop drilling inefficiencies

// Example performance monitoring
const ComponentPerformanceMonitor = {
  trackRender: (componentName, renderTime) => {
    if (renderTime > 100) { // 100ms threshold
      console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
    }
  }
};
```

### Monthly Development Tasks

#### Dependency Updates
```json
// Check for package updates
// Review package.json for outdated dependencies
{
  "devDependencies": {
    "@servicenow/sdk": "4.0.2",    // Check for newer versions
    "@servicenow/glide": "26.0.1", // Monitor ServiceNow releases
    "react": "18.2.0",             // Stay current with React
    "eslint": "8.50.0"             // Security and bug fixes
  }
}
```

#### Code Quality Assessment
```javascript
// Run automated code quality checks
// npm run lint
// npm run test
// npm run build

// Check for:
// 1. ESLint violations
// 2. TypeScript errors
// 3. Build warnings
// 4. Test failures
// 5. Security vulnerabilities
```

#### API Integration Maintenance
```javascript
// Test all external API integrations
// Validate error handling and fallback mechanisms
// Update API endpoints if needed
// Monitor API rate limits and usage

const apiHealthCheck = {
  async checkHolidayAPI() {
    // Test primary and fallback endpoints
    // Validate response format
    // Check rate limits
  },
  
  async checkServiceNowAPIs() {
    // Test table API endpoints
    // Validate authentication
    // Check response times
  }
};
```

### Quarterly Development Reviews

#### Architecture Review
- Evaluate component architecture for improvements
- Review service layer design
- Assess data flow efficiency
- Plan for scalability improvements

#### Security Assessment
```javascript
// Review client-side security
// 1. Input validation completeness
// 2. XSS prevention measures
// 3. CSRF protection
// 4. Secure API communication

const securityChecklist = {
  validateInputSanitization() {
    // Check all user input fields
    // Validate data before API calls
    // Ensure proper encoding
  },
  
  checkAuthenticationFlow() {
    // Validate session management
    // Check token refresh logic
    // Verify logout procedures
  }
};
```

## Routine Maintenance Tasks

### Data Cleanup Procedures

#### Weekly Data Maintenance
```sql
-- Clean up old system logs (older than 90 days)
DELETE FROM sys_log 
WHERE sys_created_on < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND source LIKE '%x_7767_release_man%';

-- Archive completed releases (older than 1 year)
UPDATE rm_release 
SET u_archived = true 
WHERE work_end < DATE_SUB(NOW(), INTERVAL 365 DAY)
  AND state = 'closed';
```

#### Cache Maintenance
```javascript
// Browser cache clearing recommendations
// Provide users with cache clearing instructions
// Monitor cache hit/miss ratios
// Optimize cache expiration times

const cacheMaintenanceSchedule = {
  daily: 'Clear temporary API caches',
  weekly: 'Clear user preference cache',
  monthly: 'Full cache refresh',
  quarterly: 'Cache optimization review'
};
```

### Integration Maintenance

#### External API Monitoring
```javascript
// Automated API health monitoring
const APIMonitor = {
  async checkAllAPIs() {
    const results = {};
    
    // Holiday API
    try {
      const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
      results.holidayAPI = response.ok ? 'healthy' : 'degraded';
    } catch (error) {
      results.holidayAPI = 'down';
    }
    
    // ServiceNow APIs
    try {
      const response = await fetch('/api/now/table/rm_release?sysparm_limit=1');
      results.serviceNowAPI = response.ok ? 'healthy' : 'degraded';
    } catch (error) {
      results.serviceNowAPI = 'down';
    }
    
    return results;
  },
  
  logResults(results) {
    Object.entries(results).forEach(([api, status]) => {
      if (status !== 'healthy') {
        console.warn(`API Health Warning: ${api} is ${status}`);
      }
    });
  }
};
```

## Data Management

### Data Retention Policies

#### Release Features
```sql
-- Archive old release features (retain for 2 years)
CREATE OR REPLACE PROCEDURE ArchiveReleaseFeatures()
BEGIN
    -- Move to archive table
    INSERT INTO x_7767_release_man_release_features_archive
    SELECT * FROM x_7767_release_man_release_features rf
    JOIN rm_release r ON rf.release = r.sys_id
    WHERE r.work_end < DATE_SUB(NOW(), INTERVAL 730 DAY);
    
    -- Delete from active table
    DELETE rf FROM x_7767_release_man_release_features rf
    JOIN rm_release r ON rf.release = r.sys_id
    WHERE r.work_end < DATE_SUB(NOW(), INTERVAL 730 DAY);
END;
```

#### Change Request History
```sql
-- Clean up old change request audit records
DELETE FROM sys_audit
WHERE tablename = 'change_request'
  AND sys_created_on < DATE_SUB(NOW(), INTERVAL 1095 DAY); -- 3 years
```

### Data Quality Monitoring

#### Automated Data Validation
```javascript
// Daily data quality checks
const DataQualityMonitor = {
  async validateReleaseFeatures() {
    const issues = [];
    
    // Check for required fields
    const missingRequired = await this.checkMissingRequiredFields();
    if (missingRequired.length > 0) {
      issues.push(`Missing required fields: ${missingRequired.length} records`);
    }
    
    // Check for invalid dates
    const invalidDates = await this.checkInvalidDates();
    if (invalidDates.length > 0) {
      issues.push(`Invalid dates: ${invalidDates.length} records`);
    }
    
    // Check for orphaned records
    const orphaned = await this.checkOrphanedRecords();
    if (orphaned.length > 0) {
      issues.push(`Orphaned records: ${orphaned.length} records`);
    }
    
    return issues;
  },
  
  async generateDataQualityReport() {
    const issues = await this.validateReleaseFeatures();
    
    if (issues.length > 0) {
      console.warn('Data Quality Issues Found:', issues);
      // Send notification to administrators
    }
    
    return issues;
  }
};
```

## Performance Monitoring

### Application Performance Metrics

#### Key Performance Indicators (KPIs)
```javascript
// Monitor these metrics regularly
const performanceKPIs = {
  pageLoadTime: 'Target: < 3 seconds',
  apiResponseTime: 'Target: < 2 seconds',
  userInteractionDelay: 'Target: < 100ms',
  errorRate: 'Target: < 1%',
  cacheHitRatio: 'Target: > 80%'
};

// Performance monitoring implementation
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
  }
  
  recordMetric(name, value, timestamp = Date.now()) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({ value, timestamp });
    
    // Keep only last 1000 measurements
    const measurements = this.metrics.get(name);
    if (measurements.length > 1000) {
      measurements.shift();
    }
  }
  
  getAverageMetric(name, timeWindow = 3600000) { // 1 hour default
    const now = Date.now();
    const measurements = this.metrics.get(name) || [];
    
    const recentMeasurements = measurements.filter(
      m => now - m.timestamp <= timeWindow
    );
    
    if (recentMeasurements.length === 0) return null;
    
    const sum = recentMeasurements.reduce((total, m) => total + m.value, 0);
    return sum / recentMeasurements.length;
  }
}
```

### Database Performance

#### Query Optimization
```sql
-- Monitor slow queries related to the application
SELECT 
    query_text,
    avg_execution_time,
    execution_count,
    table_name
FROM sys_db_query_stats 
WHERE query_text LIKE '%x_7767_release_man%'
  AND avg_execution_time > 1000 -- Queries taking more than 1 second
ORDER BY avg_execution_time DESC;

-- Create indexes for frequently queried fields
CREATE INDEX idx_release_features_release ON x_7767_release_man_release_features(release);
CREATE INDEX idx_release_features_product ON x_7767_release_man_release_features(product);
CREATE INDEX idx_release_features_state ON x_7767_release_man_release_features(state);
CREATE INDEX idx_change_request_release ON change_request(u_application_release);
```

## Security Maintenance

### Access Control Management

#### Role and Permission Reviews
```javascript
// Monthly access review script
const AccessReviewScript = {
  async reviewUserAccess() {
    // Get all users with access to Release Management tables
    const users = await this.getUsersWithTableAccess('x_7767_release_man_release_features');
    
    // Check for inactive users with access
    const inactiveUsers = users.filter(user => 
      user.last_login < Date.now() - (90 * 24 * 60 * 60 * 1000) // 90 days
    );
    
    if (inactiveUsers.length > 0) {
      console.warn('Inactive users with access:', inactiveUsers);
    }
    
    // Check for over-privileged users
    const overPrivileged = users.filter(user => 
      user.roles.includes('admin') && user.lastActivity.table !== 'sys_user'
    );
    
    return { inactiveUsers, overPrivileged };
  }
};
```

#### ACL Validation
```sql
-- Verify ACL coverage for all application tables
SELECT 
    name as table_name,
    (SELECT COUNT(*) FROM sys_security_acl WHERE name = CONCAT(sys_db_object.name, '.*')) as acl_count
FROM sys_db_object 
WHERE sys_scope.scope = 'x_7767_release_man'
HAVING acl_count = 0; -- Tables without ACLs
```

### Data Security

#### Sensitive Data Protection
```javascript
// Audit sensitive data access
const SensitiveDataAudit = {
  sensitiveFields: [
    'x_7767_release_man_release_features.review_comments',
    'change_request.u_application_release'
  ],
  
  async auditSensitiveAccess() {
    // Check who accessed sensitive fields in the last 30 days
    // Generate compliance reports
    // Flag unusual access patterns
  }
};
```

## Backup & Recovery

### Backup Procedures

#### Application Data Backup
```sql
-- Create backup of application tables
CREATE PROCEDURE BackupReleaseManagementData()
BEGIN
    -- Backup release features
    CREATE TABLE x_7767_release_man_release_features_backup_$(date)
    AS SELECT * FROM x_7767_release_man_release_features;
    
    -- Backup change request extensions
    SELECT cr.*, u_application_release
    INTO OUTFILE '/backup/change_requests_$(date).csv'
    FROM change_request cr
    WHERE u_application_release IS NOT NULL;
END;
```

#### Configuration Backup
```javascript
// Export application configuration
const ConfigurationBackup = {
  async exportConfiguration() {
    const config = {
      tables: await this.exportTableDefinitions(),
      uiPages: await this.exportUIPages(),
      acls: await this.exportACLs(),
      businessRules: await this.exportBusinessRules(),
      clientScripts: await this.exportClientScripts()
    };
    
    // Save to file or repository
    return JSON.stringify(config, null, 2);
  }
};
```

### Recovery Procedures

#### Disaster Recovery Plan
1. **Data Recovery**
   - Restore from most recent backup
   - Validate data integrity
   - Reconcile any lost transactions

2. **Application Recovery**
   - Redeploy application components
   - Verify external integrations
   - Test core functionality

3. **User Communication**
   - Notify users of outage
   - Provide status updates
   - Confirm service restoration

## Upgrade Procedures

### ServiceNow Platform Upgrades

#### Pre-Upgrade Checklist
```javascript
// Pre-upgrade validation
const PreUpgradeChecklist = {
  async validateCompatibility() {
    // Check for deprecated APIs
    // Validate custom code compatibility
    // Test in sub-production environment
    // Backup all customizations
  },
  
  async createUpgradeReport() {
    return {
      deprecatedAPIs: await this.checkDeprecatedAPIs(),
      customizations: await this.inventoryCustomizations(),
      testResults: await this.runCompatibilityTests(),
      backupStatus: await this.verifyBackups()
    };
  }
};
```

#### Post-Upgrade Validation
```javascript
// Post-upgrade testing
const PostUpgradeValidation = {
  async runFullSystemTest() {
    const tests = [
      this.testUIPageLoading(),
      this.testAPIIntegration(),
      this.testDataAccess(),
      this.testExternalServices(),
      this.testUserWorkflows()
    ];
    
    const results = await Promise.allSettled(tests);
    return this.analyzeTestResults(results);
  }
};
```

## Troubleshooting & Support

### Support Procedures

#### User Issue Escalation
```
Level 1: ServiceNow Administrator
├── Basic functionality issues
├── Permission problems
├── Data access issues
└── General troubleshooting

Level 2: ServiceNow Developer
├── Component functionality issues
├── API integration problems
├── Performance issues
└── Complex troubleshooting

Level 3: Senior Developer/Architect
├── Architecture issues
├── Complex integration problems
├── Security concerns
└── System design modifications
```

#### Issue Documentation
```javascript
// Standardized issue documentation
const IssueTemplate = {
  id: 'Generated unique ID',
  timestamp: 'ISO timestamp',
  reporter: 'User information',
  severity: 'Low/Medium/High/Critical',
  category: 'UI/API/Data/Integration/Performance',
  description: 'Detailed issue description',
  stepsToReproduce: 'Step-by-step reproduction',
  expectedBehavior: 'What should happen',
  actualBehavior: 'What actually happened',
  environment: 'Browser, OS, ServiceNow version',
  resolution: 'How the issue was resolved',
  preventiveMeasures: 'How to prevent recurrence'
};
```

## Best Practices

### Development Best Practices

#### Code Quality Standards
```javascript
// Enforce coding standards
const CodingStandards = {
  // 1. Use meaningful variable names
  const releaseFeaturesList = []; // Good
  const list = []; // Bad
  
  // 2. Implement proper error handling
  try {
    const data = await apiCall();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return fallbackData;
  }
  
  // 3. Use consistent formatting
  // Follow ESLint configuration
  
  // 4. Document complex logic
  /**
   * Calculates sprint impact based on holidays in the selected month
   * @param {Array} holidays - List of holidays in the month
   * @param {Array} releases - List of releases in the month
   * @returns {Object} Impact analysis with severity levels
   */
  const calculateSprintImpact = (holidays, releases) => {
    // Implementation details...
  }
};
```

#### Performance Best Practices
```javascript
// Performance optimization guidelines
const PerformanceBestPractices = {
  // 1. Use React.memo for expensive components
  const ExpensiveComponent = React.memo(({ data }) => {
    // Component implementation
  });
  
  // 2. Implement proper caching
  const cache = new Map();
  const getCachedData = (key, fetcher, ttl = 300000) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = fetcher();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  };
  
  // 3. Use debouncing for user input
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      performSearch(searchTerm);
    }, 300),
    []
  );
};
```

### Operational Best Practices

#### Change Management
1. **Testing Requirements**
   - Unit tests for all new functions
   - Integration tests for API changes
   - User acceptance testing
   - Performance impact assessment

2. **Deployment Process**
   - Development → Test → Production
   - Rollback procedures documented
   - Change approval required
   - Post-deployment validation

3. **Documentation Updates**
   - Update relevant guides
   - Notify affected users
   - Update training materials
   - Archive old documentation

#### Monitoring and Alerting
```javascript
// Automated monitoring setup
const MonitoringAlerts = {
  criticalAlerts: [
    'Application down for more than 5 minutes',
    'API error rate exceeds 5%',
    'Database connection failures',
    'External service unavailability'
  ],
  
  warningAlerts: [
    'Page load time exceeds 5 seconds',
    'Memory usage above 80%',
    'Unusual user activity patterns',
    'Data quality issues detected'
  ],
  
  setupAlerts() {
    // Configure ServiceNow notification rules
    // Set up email/SMS notifications
    // Create dashboard widgets
    // Schedule regular health checks
  }
};
```

---

*This maintenance guide should be reviewed and updated quarterly to ensure it remains current with system changes and best practices. All maintenance activities should be logged and tracked for compliance and continuous improvement purposes.*