# Release Management Center - Developer Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Metadata Components](#metadata-components)
5. [Service Layer](#service-layer)
6. [React Components](#react-components)
7. [Extending the Application](#extending-the-application)
8. [API Integration](#api-integration)
9. [Database Schema](#database-schema)
10. [Testing Guidelines](#testing-guidelines)
11. [Deployment Process](#deployment-process)

## Architecture Overview

The Release Management Center follows a modern, scalable architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                 Presentation Layer                      │
├─────────────────────────────────────────────────────────┤
│ React Components │ CSS Modules │ Service Layer         │
├─────────────────────────────────────────────────────────┤
│                 ServiceNow Layer                        │
├─────────────────────────────────────────────────────────┤
│ UI Pages │ Tables │ Records │ Business Rules           │
├─────────────────────────────────────────────────────────┤
│                 Data Layer                              │
├─────────────────────────────────────────────────────────┤
│ ServiceNow DB │ External APIs │ Cache Layer           │
└─────────────────────────────────────────────────────────┘
```

### Design Principles
1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Modularity**: Reusable components and services
3. **Scalability**: Designed to handle large datasets and multiple users
4. **Performance**: Optimized loading and caching strategies
5. **Maintainability**: Clean code with comprehensive documentation

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **JavaScript ES6+**: Modern JavaScript features
- **CSS3**: Custom styling with CSS variables
- **ServiceNow UI Framework**: Integration with ServiceNow's UI components

### Backend
- **ServiceNow Platform**: Core platform services
- **ServiceNow Fluent DSL**: Metadata definition and management
- **RESTful APIs**: ServiceNow Table API and external integrations
- **Node.js**: Build and development tooling

### External Integrations
- **Nager.Date API**: Holiday data for multiple countries
- **ServiceNow Table API**: Database operations
- **Browser APIs**: LocalStorage, Fetch, File Download

## Project Structure

```
Release Management Center/
├── now.config.json              # ServiceNow configuration
├── package.json                # Dependencies and scripts
├── docs/                       # Documentation
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── DEBUGGING_GUIDE.md
└── src/
    ├── client/                 # Frontend code
    │   ├── components/         # React components
    │   │   ├── Calendar.jsx
    │   │   ├── ReleaseCommandCenter.jsx
    │   │   ├── ReleaseFeaturesList.jsx
    │   │   ├── Calendar.css
    │   │   ├── ReleaseCommandCenter.css
    │   │   └── ReleaseFeaturesList.css
    │   └── services/           # Service layer
    │       ├── ReleaseService.js
    │       ├── HolidayService.js
    │       ├── CloneService.js
    │       ├── ChangeRequestService.js
    │       └── CalendarNotesService.js
    ├── fluent/                 # ServiceNow metadata
    │   ├── index.now.ts        # Main entry point
    │   ├── tables/             # Table definitions
    │   │   ├── release_features.now.ts
    │   │   └── change_request_extension.now.ts
    │   ├── ui-pages/           # UI page definitions
    │   │   └── release-command-center.now.ts
    │   └── records/            # Sample data
    │       ├── sprint_releases_q1_q2.now.ts
    │       ├── release_features_sprint1.now.ts
    │       └── change_requests_jan_feb_2026.now.ts
    └── server/                 # Server-side configuration
        └── tsconfig.json       # TypeScript configuration
```

## Metadata Components

### Tables

#### Release Features Table
**File**: `src/fluent/tables/release_features.now.ts`

```typescript
export const x_7767_release_man_release_features = Table({
  name: 'x_7767_release_man_release_features',
  schema: {
    story_number: StringColumn({
      label: 'Story Number',
      maxLength: 50,
      mandatory: true
    }),
    release: ReferenceColumn({
      label: 'Release',
      reference: 'rm_release',
      mandatory: true
    }),
    product: ChoiceColumn({
      label: 'Product',
      choices: {
        itsm: { label: 'ITSM', sequence: 0 },
        itom: { label: 'ITOM', sequence: 1 },
        // ... more choices
      },
      mandatory: true
    }),
    // ... additional fields
  }
});
```

**Key Features**:
- Auto-numbering with RF prefix
- 20+ fields covering complete deployment lifecycle
- Choice fields with proper sequencing
- Reference fields for data relationships
- Mandatory field validation

#### Change Request Extension
**File**: `src/fluent/tables/change_request_extension.now.ts`

```typescript
export const change_request_extension = Column({
  table: 'change_request',
  element: 'u_application_release',
  column: ReferenceColumn({
    label: 'Application Release',
    reference: 'rm_release'
  })
});
```

**Purpose**: Extends OOTB change_request table with release relationship

### UI Pages

#### Release Command Center
**File**: `src/fluent/ui-pages/release-command-center.now.ts`

```typescript
export const releaseCommandCenter = UIPage({
  name: 'x_7767_release_man_command_center',
  htmlContent: Now.include('../client/release-command-center.html'),
  clientScript: `
    window.React = React;
    window.ReactDOM = ReactDOM;
    ${Now.include('../client/release-command-center.jsx')}
  `,
  processingScript: '',
  category: 'general'
});
```

**Key Features**:
- React integration with ServiceNow
- Dynamic content loading
- Client-side routing capabilities

### Records (Sample Data)

Sample data files provide realistic test data for development and demonstration:

- **Sprint Releases**: 13 bi-weekly releases for 2026
- **Release Features**: 10+ features across all products
- **Change Requests**: Sample change requests linked to releases

## Service Layer

### Base Service Pattern

All services follow a consistent pattern:

```javascript
export class BaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async get(key, fetcher, timeout = 8000) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const data = await fetcher(controller.signal);
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

### Release Service
**File**: `src/client/services/ReleaseService.js`

**Core Methods**:
- `getReleases(filters)`: Fetch releases with filtering
- `getCurrentRelease()`: Get active release based on current date
- `getReleaseFeatures(releaseSysId)`: Get features for specific release
- `createReleaseFeature(data)`: Create new feature
- `updateReleaseFeature(sysId, data)`: Update existing feature
- `deleteReleaseFeature(sysId)`: Delete feature

**Usage Example**:
```javascript
const releaseService = new ReleaseService();
const releases = await releaseService.getReleases({
  sysparm_query: 'work_start>=2026-01-01'
});
```

### Holiday Service
**File**: `src/client/services/HolidayService.js`

**Features**:
- Multi-country support (US, India, Singapore)
- Circuit breaker pattern for API failures
- Comprehensive fallback data
- 24-hour caching

**Usage Example**:
```javascript
const holidayService = new HolidayService();
const holidays = await holidayService.getHolidaysForMonth(2026, 1, ['US', 'IN', 'SG']);
```

### Clone Service
**File**: `src/client/services/CloneService.js`

**Features**:
- Integration with clone_instance table
- State management for clone processes
- Mock data fallback for development

### Change Request Service
**File**: `src/client/services/ChangeRequestService.js`

**Features**:
- CRUD operations for change requests
- Release-based filtering
- Month-based data retrieval

### Calendar Notes Service
**File**: `src/client/services/CalendarNotesService.js`

**Features**:
- LocalStorage-based persistence
- Note categorization (8 types)
- Date-based organization

## React Components

### Component Hierarchy

```
ReleaseCommandCenter (Root)
├── Calendar
│   ├── Month View
│   ├── Year View
│   └── Note Modal
├── Holiday Section
├── Sprint Impact Analysis
├── Sidebar
│   ├── Upcoming Releases
│   ├── Clone Schedule
│   ├── Change Requests
│   └── Release Summary
└── ReleaseFeaturesList
    ├── Product Count Badges
    ├── Feature Table
    ├── New Feature Modal
    ├── Review Modal
    └── Column Management
```

### State Management

Each component manages its own state using React hooks:

```javascript
const [releases, setReleases] = useState([]);
const [selectedRelease, setSelectedRelease] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### Component Communication

Components communicate through props and callback functions:

```javascript
// Parent to Child
<Calendar 
  releases={releases}
  selectedRelease={selectedRelease}
  onReleaseSelect={handleReleaseSelect}
/>

// Child to Parent
const handleReleaseSelect = (release) => {
  setSelectedRelease(release);
  loadReleaseFeatures(release.sys_id);
};
```

## Extending the Application

### Adding New Metadata Types

1. **Create Fluent Definition**:
```typescript
// src/fluent/tables/new_table.now.ts
export const newTable = Table({
  name: 'x_7767_release_man_new_table',
  schema: {
    // Define fields
  }
});
```

2. **Create Service Layer**:
```javascript
// src/client/services/NewService.js
export class NewService extends BaseService {
  async getRecords() {
    // Implementation
  }
}
```

3. **Create React Component**:
```javascript
// src/client/components/NewComponent.jsx
export default function NewComponent({ data }) {
  // Implementation
}
```

4. **Integrate with Main Component**:
```javascript
// Add to ReleaseCommandCenter.jsx
import NewComponent from './NewComponent';
const [newData, setNewData] = useState([]);
```

### Adding New Service Integrations

1. **Create Service Class**:
```javascript
export class NewAPIService extends BaseService {
  constructor() {
    super();
    this.baseURL = 'https://api.example.com';
  }

  async fetchData(params) {
    return this.get(`data-${JSON.stringify(params)}`, async (signal) => {
      const response = await fetch(`${this.baseURL}/data`, {
        signal,
        headers: { 'Accept': 'application/json' }
      });
      return response.json();
    });
  }
}
```

2. **Add Error Handling**:
```javascript
try {
  const data = await newAPIService.fetchData(params);
  setData(data);
} catch (error) {
  console.error('API Error:', error);
  setError('Failed to load data');
  // Provide fallback data
  setData(fallbackData);
}
```

### Customizing UI Components

#### Adding New Product Types

1. **Update Table Schema**:
```typescript
product: ChoiceColumn({
  choices: {
    // existing choices...
    newproduct: { label: 'New Product', sequence: 9 }
  }
})
```

2. **Update Component Constants**:
```javascript
const PRODUCT_CONFIGS = {
  // existing configs...
  newproduct: {
    label: 'New Product',
    color: '#FF5722',
    icon: '🆕'
  }
};
```

#### Adding New Note Types

1. **Update Note Service**:
```javascript
const NOTE_TYPES = {
  // existing types...
  custom: { 
    label: 'Custom', 
    icon: '🔧', 
    color: '#607D8B' 
  }
};
```

2. **Update Component**:
```javascript
// Add to note type selection dropdown
```

## API Integration

### ServiceNow Table API

**Authentication**:
```javascript
headers: {
  "Accept": "application/json",
  "X-UserToken": window.g_ck
}
```

**Common Query Patterns**:
```javascript
// Date range filtering
sysparm_query: `sys_created_on>=2026-01-01^sys_created_on<2026-02-01`

// Reference filtering  
sysparm_query: `release=${releaseSysId}`

// Display values
sysparm_display_value: 'all'

// Field selection
sysparm_fields: 'sys_id,number,short_description,state'
```

### External API Integration

**Holiday API Example**:
```javascript
const response = await fetch(
  `https://date.nager.at/api/v3/PublicHolidays/2026/US`,
  { 
    signal: abortController.signal,
    headers: { 'Accept': 'application/json' }
  }
);
```

**Error Handling Pattern**:
```javascript
try {
  const data = await apiCall();
  return data;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request timed out');
  }
  return fallbackData;
}
```

## Database Schema

### Core Tables

#### x_7767_release_man_release_features
```sql
Field Name                Type           Length    Reference
sys_id                   GUID           32        
number                   String         40        Auto-generated
story_number             String         50        
release                  Reference      32        rm_release
product                  Choice         40        
short_description        String         255       
developer                Reference      32        sys_user
techlead                 Reference      32        sys_user
uat_completed           Boolean                   
deployment_type          Choice         40        
update_set_name         String         255       
application_scope        Reference      32        sys_scope
out_of_update_set       Boolean                   
deployment_sequence      Integer                  
deployment_dependency    String         500       
pre_deployment_activities Text                    
post_deployment_activities Text                   
review_comments          Journal                  
state                    Choice         40        
estimated_duration       Integer                  
actual_duration          Integer                  
rollback_procedure       Text                     
validation_steps         Text                     
sys_created_on          Datetime                 
sys_updated_on          Datetime                 
```

#### change_request Extension
```sql
Field Name              Type           Length    Reference
u_application_release   Reference      32        rm_release
```

### Relationships

```
rm_release (1) ←→ (Many) release_features
rm_release (1) ←→ (Many) change_request [via u_application_release]
sys_user (1) ←→ (Many) release_features [developer, techlead]
sys_scope (1) ←→ (Many) release_features [application_scope]
```

## Testing Guidelines

### Unit Testing Components

```javascript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../components/Calendar';

test('Calendar displays release events', () => {
  const mockReleases = [
    { sys_id: '1', number: 'REL001', work_start: '2026-01-01' }
  ];
  
  render(<Calendar releases={mockReleases} />);
  expect(screen.getByText('REL001')).toBeInTheDocument();
});
```

### Service Testing

```javascript
// Example service test
import { ReleaseService } from '../services/ReleaseService';

test('ReleaseService fetches releases', async () => {
  const service = new ReleaseService();
  const releases = await service.getReleases();
  expect(Array.isArray(releases)).toBe(true);
});
```

### Integration Testing

1. **Test Data Setup**: Use record files to create consistent test data
2. **API Mocking**: Mock external APIs for consistent testing
3. **User Flow Testing**: Test complete user workflows end-to-end

### Manual Testing Checklist

- [ ] Calendar navigation works in both month and year views
- [ ] Release selection updates all dependent sections
- [ ] Inline editing saves correctly
- [ ] Export functionality works
- [ ] Holiday data loads for all countries
- [ ] Clone schedule displays correctly
- [ ] Change request creation works
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] Error handling displays appropriate messages

## Deployment Process

### Development Workflow

1. **Make Changes**: Edit source files in appropriate directories
2. **Run Diagnostics**: `now-sdk diagnostics` to check for errors
3. **Build Application**: `npm run build` to compile and validate
4. **Deploy to Instance**: `npm run deploy` to push changes
5. **Test Changes**: Verify functionality in ServiceNow instance

### Build Process

```bash
# Install dependencies
npm install

# Build application
npm run build

# Deploy to instance
npm run deploy
```

### Deployment Checklist

- [ ] All TypeScript files compile without errors
- [ ] React components render correctly
- [ ] Service integrations work properly
- [ ] Database schema updates applied
- [ ] Permissions configured correctly
- [ ] Sample data loaded successfully
- [ ] Cross-browser testing completed
- [ ] Performance testing passed
- [ ] User acceptance testing completed
- [ ] Documentation updated

### Environment Configuration

#### Development
- Local development with hot reloading
- Mock data for external APIs
- Debug logging enabled

#### Production
- Optimized builds
- Error reporting
- Performance monitoring
- Security configurations

---

*This developer guide provides comprehensive information for extending and maintaining the Release Management Center. For architectural details, see the Architecture Guide.*