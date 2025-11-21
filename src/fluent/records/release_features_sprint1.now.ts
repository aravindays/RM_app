import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'

// Sample Release Features for Sprint 1 (distributed across products)
// Note: These will need to be updated with actual release sys_id after deployment

// ITSM Features (3 features - 25% representation)
export const itsm_feature_1 = Record({
  $id: Now.ID['itsm-feature-1'],
  table: 'x_7767_release_man_release_features',
  data: {
    story_number: 'ITSM-2026-001',
    release: '03b87518c3ef3210b243f0ffeeaad376', // Placeholder sys_id - will need to be updated
    product: 'itsm',
    short_description: 'Enhance incident assignment rules for major incidents',
    developer: '6816f79cc0a8016401c5a33be04be441', // admin user sys_id placeholder
    deployment_type: 'update_set',
    update_set_name: 'ITSM_Incident_Assignment_Enhancement_v1.0',
    deployment_sequence: 10,
    uat_completed: true,
    state: 'approved',
    estimated_duration: 30,
    pre_deployment_activities: 'Backup current assignment rules\nNotify incident management team',
    post_deployment_activities: 'Validate assignment rules\nTest with sample incidents',
    validation_steps: 'Create test incident and verify auto-assignment'
  }
})

export const itsm_feature_2 = Record({
  $id: Now.ID['itsm-feature-2'],
  table: 'x_7767_release_man_release_features',
  data: {
    story_number: 'ITSM-2026-002',
    release: '03b87518c3ef3210b243f0ffeeaad376', // Placeholder sys_id - will need to be updated
    product: 'itsm',
    short_description: 'Add SLA breach notifications for change requests',
    developer: '6816f79cc0a8016401c5a33be04be441', // admin user sys_id placeholder
    deployment_type: 'update_set',
    update_set_name: 'ITSM_Change_SLA_Notifications_v1.0',
    deployment_sequence: 20,
    uat_completed: true,
    state: 'approved',
    estimated_duration: 45,
    pre_deployment_activities: 'Review current SLA configurations\nPrepare notification templates',
    post_deployment_activities: 'Test SLA notifications\nValidate email templates',
    validation_steps: 'Create test change request and validate SLA notifications'
  }
})

export const itsm_feature_3 = Record({
  $id: Now.ID['itsm-feature-3'],
  table: 'x_7767_release_man_release_features',
  data: {
    story_number: 'ITSM-2026-003',
    release: '03b87518c3ef3210b243f0ffeeaad376', // Placeholder sys_id - will need to be updated
    product: 'itsm',
    short_description: 'Implement automated problem record creation from incidents',
    developer: '6816f79cc0a8016401c5a33be04be441', // admin user sys_id placeholder
    deployment_type: 'update_set',
    update_set_name: 'ITSM_Auto_Problem_Creation_v1.0',
    deployment_sequence: 30,
    uat_completed: false,
    state: 'review',
    estimated_duration: 60,
    pre_deployment_activities: 'Configure problem creation rules\nSet up correlation logic',
    post_deployment_activities: 'Monitor automatic problem creation\nValidate correlation accuracy',
    validation_steps: 'Create multiple related incidents and verify problem auto-creation'
  }
})

// ITOM Features (2 features - 20% representation)
export const itom_feature_1 = Record({
  $id: Now.ID['itom-feature-1'],
  table: 'x_7767_release_man_release_features',
  data: {
    story_number: 'ITOM-2026-001',
    release: '03b87518c3ef3210b243f0ffeeaad376', // Placeholder sys_id - will need to be updated
    product: 'itom',
    short_description: 'Update monitoring thresholds for critical infrastructure',
    developer: '6816f79cc0a8016401c5a33be04be441', // admin user sys_id placeholder
    deployment_type: 'manual_config',
    deployment_sequence: 40,
    uat_completed: true,
    state: 'approved',
    estimated_duration: 90,
    deployment_dependency: 'Must coordinate with infrastructure team during maintenance window',
    pre_deployment_activities: 'Schedule maintenance window\nNotify stakeholders\nBackup current thresholds',
    post_deployment_activities: 'Monitor alert volumes\nValidate threshold effectiveness\nUpdate documentation',
    validation_steps: 'Review monitoring dashboards for 24 hours post-deployment'
  }
})

export const itom_feature_2 = Record({
  $id: Now.ID['itom-feature-2'],
  table: 'x_7767_release_man_release_features',
  data: {
    story_number: 'ITOM-2026-002',
    release: '03b87518c3ef3210b243f0ffeeaad376', // Placeholder sys_id - will need to be updated
    product: 'itom',
    short_description: 'Deploy new health check scripts for database servers',
    developer: '6816f79cc0a8016401c5a33be04be441', // admin user sys_id placeholder
    deployment_type: 'data_load',
    deployment_sequence: 50,
    uat_completed: true,
    state: 'deployed',
    estimated_duration: 120,
    actual_duration: 115,
    pre_deployment_activities: 'Test scripts in dev environment\nValidate permissions\nSchedule deployment window',
    post_deployment_activities: 'Execute health checks\nValidate script outputs\nUpdate monitoring dashboards',
    validation_steps: 'Run health checks on all database servers and verify results'
  }
})