import '@servicenow/sdk/global'
import { ReferenceColumn } from '@servicenow/sdk/core'

// Extend change_request table to add application release reference
ReferenceColumn({
  table: 'change_request',
  column: 'u_application_release',
  label: 'Application Release',
  reference: 'rm_release',
  attributes: {
    edge_encryption_enabled: false
  }
});