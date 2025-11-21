import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import releaseCommandCenterHtml from '../../client/release-command-center.html'

export const release_command_center = UiPage({
  $id: Now.ID['release-command-center'],
  endpoint: 'x_7767_release_man_command_center.do',
  description: 'Main dashboard for release management with calendar view and release features tracking',
  category: 'general',
  html: releaseCommandCenterHtml,
  direct: true
})