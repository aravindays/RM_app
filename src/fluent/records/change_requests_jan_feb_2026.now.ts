import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core';

// Create synthetic change request records for Jan and Feb 2026 releases

// January 2026 Change Requests
Record({
  $id: Now.ID['cr_jan_2026_1'],
  table: 'change_request',
  data: {
    number: 'CHG0030001',
    u_application_release: Now.ID['sprint_1_release'], // Reference to Sprint 1 release
    short_description: 'Deploy ITSM enhancements for Q1 sprint release',
    description: 'Comprehensive deployment of ITSM module enhancements including incident management improvements, service catalog updates, and knowledge base integration features.',
    cmdb_ci: 'Production ITSM Server',
    state: '1', // Scheduled
    approval: 'approved',
    priority: '2', // High
    risk: 'medium',
    impact: '2', // Medium
    category: 'software',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-01-05 10:30:00'
  }
});

Record({
  $id: Now.ID['cr_jan_2026_2'],
  table: 'change_request',
  data: {
    number: 'CHG0030002',
    u_application_release: Now.ID['sprint_1_release'],
    short_description: 'Update load balancer configuration for new release',
    description: 'Configure load balancer settings to support new application features and improved traffic distribution for the January release deployment.',
    cmdb_ci: 'Production Load Balancer',
    state: '2', // In Progress
    approval: 'requested',
    priority: '3', // Moderate
    risk: 'low',
    impact: '3', // Low
    category: 'network',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-01-08 14:15:00'
  }
});

Record({
  $id: Now.ID['cr_jan_2026_3'],
  table: 'change_request',
  data: {
    number: 'CHG0030003',
    u_application_release: Now.ID['sprint_1_release'],
    short_description: 'Database schema updates for feature rollout',
    description: 'Apply database schema changes required for new features including table modifications, index creation, and stored procedure updates.',
    cmdb_ci: 'Production Database Cluster',
    state: '-1', // Review
    approval: 'not requested',
    priority: '2', // High
    risk: 'high',
    impact: '1', // High
    category: 'software',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-01-12 09:45:00'
  }
});

Record({
  $id: Now.ID['cr_jan_2026_4'],
  table: 'change_request',
  data: {
    number: 'CHG0030004',
    u_application_release: Now.ID['sprint_1_release'],
    short_description: 'Security certificate renewal for production services',
    description: 'Renew SSL certificates for production web services to ensure continued secure communication and compliance with security policies.',
    cmdb_ci: 'Production Web Server',
    state: '3', // Closed
    approval: 'approved',
    priority: '1', // Critical
    risk: 'low',
    impact: '2', // Medium
    category: 'security',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-01-15 16:20:00'
  }
});

// February 2026 Change Requests
Record({
  $id: Now.ID['cr_feb_2026_1'],
  table: 'change_request',
  data: {
    number: 'CHG0030005',
    u_application_release: Now.ID['sprint_2_release'], // Reference to Sprint 2 release
    short_description: 'ITOM monitoring system upgrade for enhanced visibility',
    description: 'Upgrade ITOM monitoring infrastructure to provide enhanced visibility into system performance and proactive alerting capabilities.',
    cmdb_ci: 'ITOM Monitoring Server',
    state: '1', // Scheduled
    approval: 'approved',
    priority: '2', // High
    risk: 'medium',
    impact: '2', // Medium
    category: 'software',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-02-03 11:00:00'
  }
});

Record({
  $id: Now.ID['cr_feb_2026_2'],
  table: 'change_request',
  data: {
    number: 'CHG0030006',
    u_application_release: Now.ID['sprint_2_release'],
    short_description: 'API gateway configuration for microservices architecture',
    description: 'Configure API gateway to support new microservices architecture including rate limiting, authentication, and service discovery features.',
    cmdb_ci: 'API Gateway Server',
    state: '2', // In Progress
    approval: 'requested',
    priority: '3', // Moderate
    risk: 'medium',
    impact: '3', // Low
    category: 'software',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-02-07 13:30:00'
  }
});

Record({
  $id: Now.ID['cr_feb_2026_3'],
  table: 'change_request',
  data: {
    number: 'CHG0030007',
    u_application_release: Now.ID['sprint_2_release'],
    short_description: 'Backup system enhancement and disaster recovery testing',
    description: 'Enhance backup systems with improved scheduling and implement comprehensive disaster recovery testing procedures.',
    cmdb_ci: 'Backup Infrastructure',
    state: '0', // New
    approval: 'not requested',
    priority: '2', // High
    risk: 'low',
    impact: '2', // Medium
    category: 'infrastructure',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-02-10 08:15:00'
  }
});

Record({
  $id: Now.ID['cr_feb_2026_4'],
  table: 'change_request',
  data: {
    number: 'CHG0030008',
    u_application_release: Now.ID['sprint_2_release'],
    short_description: 'Mobile application performance optimization',
    description: 'Optimize mobile application performance through code refactoring, caching improvements, and enhanced API response times.',
    cmdb_ci: 'Mobile Application Server',
    state: '-1', // Review
    approval: 'requested',
    priority: '3', // Moderate
    risk: 'low',
    impact: '3', // Low
    category: 'software',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-02-14 15:45:00'
  }
});

Record({
  $id: Now.ID['cr_feb_2026_5'],
  table: 'change_request',
  data: {
    number: 'CHG0030009',
    u_application_release: Now.ID['sprint_2_release'],
    short_description: 'Data archival process implementation for compliance',
    description: 'Implement automated data archival processes to ensure compliance with data retention policies and optimize database performance.',
    cmdb_ci: 'Data Archive System',
    state: '1', // Scheduled
    approval: 'approved',
    priority: '2', // High
    risk: 'medium',
    impact: '1', // High
    category: 'data',
    assigned_to: 'admin',
    requested_by: 'admin',
    sys_created_on: '2026-02-18 12:10:00'
  }
});