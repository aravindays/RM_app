import '@servicenow/sdk/global'
import { Table, StringColumn, ReferenceColumn, ChoiceColumn, BooleanColumn, IntegerColumn } from '@servicenow/sdk/core'

export const x_7767_release_man_release_features = Table({
  name: 'x_7767_release_man_release_features',
  label: 'Release Features',
  schema: {
    number: StringColumn({
      label: 'Number',
      maxLength: 40,
      read_only: true,
      default: 'javascript:global.getNextObjNumberPadded();'
    }),
    story_number: StringColumn({
      label: 'Story Number',
      maxLength: 50,
      mandatory: true
    }),
    release: ReferenceColumn({
      label: 'Release',
      referenceTable: 'rm_release',
      mandatory: true
    }),
    product: ChoiceColumn({
      label: 'Product',
      mandatory: true,
      dropdown: 'dropdown_without_none',
      choices: {
        itsm: { label: 'ITSM - IT Service Management', sequence: 0 },
        itom: { label: 'ITOM - IT Operations Management', sequence: 1 },
        itam: { label: 'ITAM - IT Asset Management', sequence: 2 },
        apm: { label: 'APM - Application Portfolio Management', sequence: 3 },
        sdo: { label: 'SDO - Service Delivery Optimization', sequence: 4 },
        irm: { label: 'IRM - Integrated Risk Management', sequence: 5 },
        hrsd: { label: 'HRSD - HR Service Delivery', sequence: 6 },
        lsd: { label: 'LSD - Legal Service Delivery', sequence: 7 },
        spm: { label: 'SPM - Strategic Portfolio Management', sequence: 8 }
      }
    }),
    short_description: StringColumn({
      label: 'Short Description',
      maxLength: 255,
      mandatory: true
    }),
    developer: ReferenceColumn({
      label: 'Developer',
      referenceTable: 'sys_user',
      mandatory: true
    }),
    uat_completed: BooleanColumn({
      label: 'UAT Completed',
      default: 'false'
    }),
    deployment_type: ChoiceColumn({
      label: 'Deployment Type',
      mandatory: true,
      dropdown: 'dropdown_without_none',
      choices: {
        update_set: { label: 'Update Set', sequence: 0 },
        manual_config: { label: 'Manual Configuration', sequence: 1 },
        data_load: { label: 'Data Load', sequence: 2 },
        xml_import: { label: 'XML Import', sequence: 3 },
        plugin: { label: 'Plugin Activation', sequence: 4 },
        pre_deploy: { label: 'Pre-deployment Step', sequence: 5 },
        post_deploy: { label: 'Post-deployment Step', sequence: 6 },
        batch: { label: 'Batch Update', sequence: 7 }
      }
    }),
    update_set_name: StringColumn({
      label: 'Update Set Name',
      maxLength: 255
    }),
    application_scope: ReferenceColumn({
      label: 'Application Scope',
      referenceTable: 'sys_scope'
    }),
    out_of_update_set: BooleanColumn({
      label: 'Out of Update Set',
      default: 'false'
    }),
    deployment_sequence: IntegerColumn({
      label: 'Deployment Sequence',
      mandatory: true
    }),
    deployment_dependency: StringColumn({
      label: 'Deployment Dependency',
      maxLength: 500
    }),
    pre_deployment_activities: StringColumn({
      label: 'Pre-deployment Activities',
      maxLength: 4000
    }),
    post_deployment_activities: StringColumn({
      label: 'Post-deployment Activities',
      maxLength: 4000
    }),
    review_comments: StringColumn({
      label: 'Review Comments',
      maxLength: 4000
    }),
    techlead: ReferenceColumn({
      label: 'Tech Lead',
      referenceTable: 'sys_user'
    }),
    state: ChoiceColumn({
      label: 'State',
      dropdown: 'dropdown_with_none',
      default: 'draft',
      choices: {
        draft: { label: 'Draft', sequence: 0 },
        ready: { label: 'Ready for Review', sequence: 1 },
        review: { label: 'In Review', sequence: 2 },
        approved: { label: 'Approved', sequence: 3 },
        deployed: { label: 'Deployed', sequence: 4 },
        failed: { label: 'Failed', sequence: 5 },
        rollback: { label: 'Rollback', sequence: 6 }
      }
    }),
    estimated_duration: IntegerColumn({
      label: 'Estimated Duration (minutes)'
    }),
    actual_duration: IntegerColumn({
      label: 'Actual Duration (minutes)'
    }),
    rollback_procedure: StringColumn({
      label: 'Rollback Procedure',
      maxLength: 4000
    }),
    validation_steps: StringColumn({
      label: 'Validation Steps',
      maxLength: 4000
    })
  },
  auto_number: {
    prefix: 'RF',
    number: 1000,
    number_of_digits: 7
  },
  display: 'short_description',
  extensible: false,
  accessible_from: 'public',
  allow_web_service_access: true,
  actions: ['create', 'read', 'update', 'delete']
})