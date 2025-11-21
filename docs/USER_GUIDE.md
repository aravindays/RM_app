# Release Management Center - User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Calendar Features](#calendar-features)
4. [Release Features Management](#release-features-management)
5. [Holiday Integration](#holiday-integration)
6. [Clone Schedule Management](#clone-schedule-management)
7. [Change Request Integration](#change-request-integration)
8. [Tips & Best Practices](#tips--best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The Release Management Center is a comprehensive ServiceNow application designed to provide unified calendar management and release feature tracking for sprint-based deployments. It integrates with multiple ServiceNow tables and external APIs to provide a holistic view of release management activities.

### Key Benefits
- **Unified View**: Single dashboard for releases, features, holidays, clones, and change requests
- **Interactive Calendar**: Visual representation of release schedules with auto-loading capabilities
- **Real-time Updates**: Dynamic data loading with month-based filtering
- **Professional UI**: ServiceNow Coral Theme compliant interface
- **Multi-Country Support**: Holiday integration for US, India, and Singapore

## Getting Started

### Accessing the Application
1. Navigate to: `https://[instance].service-now.com/x_7767_release_man_command_center.do`
2. The main dashboard will load with the current month's data
3. The application automatically selects the current active release (if any)

### Dashboard Layout
```
┌─────────────────────────────────────────────────────┐
│ Release Command Center Header                        │
├──────────────────────────┬──────────────────────────┤
│ Left Panel (70%)         │ Right Sidebar (30%)     │
│ ┌─────────────────────┐  │ ┌─────────────────────┐  │
│ │ Release Calendar    │  │ │ Upcoming Releases   │  │
│ └─────────────────────┘  │ └─────────────────────┘  │
│ ┌─────────────────────┐  │ ┌─────────────────────┐  │
│ │ Upcoming Holidays   │  │ │ Clone Schedule      │  │
│ └─────────────────────┘  │ └─────────────────────┘  │
│ ┌─────────────────────┐  │ ┌─────────────────────┐  │
│ │ Sprint Impact       │  │ │ Change Requests     │  │
│ └─────────────────────┘  │ └─────────────────────┘  │
│                          │ ┌─────────────────────┐  │
│                          │ │ Release Summary     │  │
│                          │ └─────────────────────┘  │
└──────────────────────────┴──────────────────────────┘
│ Release Features Section (Full Width)               │
└─────────────────────────────────────────────────────┘
```

## Calendar Features

### Month View
- **Navigation**: Use `<` and `>` buttons or directly click month/year
- **Release Events**: Shows release start (🚀) and end (📦) dates
- **Auto-Selection**: Automatically loads features for releases in current month
- **Visual Indicators**: Selected releases highlighted in blue

### Year View
- **Chronological Display**: All releases sorted by release date
- **Quick Navigation**: Click any release to view details
- **Release Information**: Shows release number, dates, and description

### Calendar Notes
1. **Adding Notes**: Click the ➕ button on any date
2. **Note Types**: Choose from 8 categories:
   - ℹ️ Information (Blue)
   - ⚠️ Warning (Orange)
   - ❗ Important (Red)
   - 👥 Meeting (Purple)
   - 📅 Deadline (Pink)
   - 🔔 Reminder (Green)
   - 🎉 Celebration (Orange)
   - 🔧 Maintenance (Gray)
3. **Viewing Notes**: Notes display as colored indicators on calendar dates
4. **Editing**: Click existing note to modify or delete

## Release Features Management

### Viewing Features
- Features automatically load when a release is selected
- Use product filter badges to filter by specific products
- Search across Story#, Description, and Update Set Name

### Product Count Badges
Interactive badges showing feature count by product:
- 🎫 ITSM (Blue) - IT Service Management
- 📊 ITOM (Green) - IT Operations Management  
- 💼 ITAM (Amber) - IT Asset Management
- 📱 APM (Purple) - Application Portfolio Management
- 🚀 SDO (Pink) - Service Delivery Optimization
- 🛡️ IRM (Red) - Integrated Risk Management
- 👥 HRSD (Cyan) - HR Service Delivery
- ⚖️ LSD (Indigo) - Legal Service Delivery
- 📈 SPM (Teal) - Strategic Portfolio Management

### Inline Editing
1. **Activate Editing**: Click any editable cell
2. **Field Types**:
   - Text fields: Direct text input
   - Dropdowns: Select from predefined values
   - Checkboxes: Toggle boolean values
3. **Auto-Save**: Changes save on blur or Enter key
4. **Visual Feedback**: 
   - 🔄 Yellow: Saving
   - ✅ Green: Success
   - ❌ Red: Error
5. **Conflict Detection**: Warns if another user modified the same field

### Adding New Features
1. **Click**: "+ New Feature" button
2. **Modal Fields**: Complete all required fields:
   - Story Number (format: PRODUCT-YEAR-NUMBER)
   - Product selection
   - Short Description
   - Developer assignment
   - Deployment type and sequence
3. **Smart Defaults**: Release and sequence auto-populated
4. **Validation**: Real-time field validation with error messages

### Review Process
1. **Review Button**: Click 👁️ in Actions column
2. **Review Fields**:
   - Pre-deployment Activities
   - Post-deployment Activities  
   - Deployment Dependencies
   - Review Comments
3. **Save Changes**: Updates save immediately to database

### Export Functionality
1. **Select Records**: Use checkboxes to select desired features
2. **Export Button**: Click "📊 Export (N)" where N is selected count
3. **File Download**: CSV file downloads with filename `release-features-YYYY-MM-DD.csv`
4. **Columns**: Exports all visible columns based on current view settings

### Column Management
1. **Access**: Click "⚙️ Columns" button
2. **Toggle Visibility**: Check/uncheck columns to show/hide
3. **Available Columns**: All 20+ table fields including:
   - Core: Number, Story#, Product, Description, Developer
   - Status: UAT, State, Approval, Duration
   - Process: Dependencies, Activities, Comments
4. **Persistence**: Column settings maintained during session

## Holiday Integration

### Multi-Country Support
The application displays holidays for three countries:
- 🇺🇸 **United States**: Federal holidays
- 🇮🇳 **India**: National and religious holidays  
- 🇸🇬 **Singapore**: Public holidays

### Dynamic Display
- **Month-Based**: Shows only holidays for selected calendar month
- **Real-Time Updates**: Holiday list updates when navigating months
- **Countdown Timers**: Days remaining until each holiday
- **Visual Indicators**: Country flags and holiday names

### Holiday Sources
- **Primary**: Nager.Date API for real-time data
- **Fallback**: Comprehensive static holiday database
- **Caching**: 24-hour cache for performance optimization

## Clone Schedule Management

### Viewing Clone Instances
- **Dynamic Display**: Shows clones scheduled for selected month
- **Key Information**: Clone ID, Target Instance, Schedule, State
- **State Indicators**:
  - 📅 Scheduled (Blue)
  - ⚙️ In Progress (Orange)  
  - ✅ Completed (Green)
  - ❌ Failed (Red)
  - 🚫 Cancelled (Gray)

### Accessing Clone Records
- **Clickable Links**: Clone IDs link directly to ServiceNow records
- **New Tab**: Records open in separate tab for easy navigation
- **Context Preserved**: Original page remains intact

## Change Request Integration

### Creating Change Requests
1. **Prerequisites**: Select a release first
2. **Click**: "+ Create Change Request" button
3. **New Tab**: ServiceNow change request form opens
4. **Pre-filled Data**: Release field automatically populated
5. **Standard Process**: Follow normal ServiceNow change request workflow

### Viewing Change Requests
- **Month-Based**: Shows change requests for selected calendar month
- **Release-Filtered**: Only displays requests related to selected release
- **Key Fields Displayed**:
  - **Number**: Clickable link to change request record
  - **CMDB CI**: Configuration item information
  - **State**: Visual state indicators with icons
  - **Approval**: Approval status badges

### Change Request States
- 📋 New (Gray)
- 🔍 Assess (Blue)  
- ✋ Authorize (Orange)
- 📅 Scheduled (Purple)
- ⚙️ Implement (Cyan)
- 👁️ Review (Pink)
- ✅ Closed (Green)
- ❌ Cancelled (Red)

## Tips & Best Practices

### Performance Optimization
1. **Use Filters**: Apply product filters to reduce data load
2. **Month Navigation**: Navigate one month at a time for best performance
3. **Cache Awareness**: Holiday and clone data cached for faster loading

### Data Management
1. **Consistent Naming**: Use consistent story number formats (PRODUCT-YEAR-NUMBER)
2. **Regular Updates**: Keep UAT status and deployment sequences current
3. **Review Process**: Use review functionality for quality control

### Navigation Tips
1. **Keyboard Shortcuts**: Use Tab for field navigation in inline editing
2. **Multi-Selection**: Use Ctrl+Click for selecting multiple features
3. **Context Switching**: Use browser tabs to maintain multiple contexts

### Workflow Optimization
1. **Start with Calendar**: Select month and release before detailed work
2. **Batch Operations**: Use export for bulk data analysis
3. **Regular Reviews**: Schedule regular review sessions for feature quality

## Troubleshooting

### Common Issues

#### Page Loading Problems
- **Symptoms**: Blank page or loading indefinitely
- **Solutions**:
  1. Refresh the page (Ctrl+F5)
  2. Clear browser cache
  3. Check browser console for errors
  4. Verify user permissions

#### Data Not Loading
- **Symptoms**: Empty sections or "No data available"
- **Solutions**:
  1. Verify release selection
  2. Check date range (ensure releases exist for selected month)
  3. Refresh data using browser refresh
  4. Check ServiceNow table permissions

#### Inline Editing Issues
- **Symptoms**: Cannot edit cells or changes not saving
- **Solutions**:
  1. Verify user has write permissions to x_7767_release_man_release_features table
  2. Check for browser script blockers
  3. Ensure stable network connection
  4. Try refreshing the page

#### Holiday Data Missing
- **Symptoms**: Holiday section shows "Loading..." indefinitely
- **Solutions**:
  1. Check external internet connectivity
  2. Wait for fallback data to load (30 seconds)
  3. Navigate to different month and back
  4. Clear browser cache

#### Export Not Working
- **Symptoms**: Export button disabled or download fails
- **Solutions**:
  1. Ensure at least one record is selected
  2. Check browser pop-up blockers
  3. Verify download permissions
  4. Try different browser

### Browser Compatibility
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Issues**: If features not working, try Chrome as primary browser
- **JavaScript**: Ensure JavaScript is enabled

### Performance Issues
- **Large Datasets**: Use product filters to reduce data load
- **Slow Loading**: Check network connectivity and ServiceNow instance performance
- **Memory Issues**: Close unused browser tabs and refresh application

## Support & Feedback

For additional support or to report issues:
1. Check ServiceNow instance system logs
2. Contact ServiceNow administrator
3. Review browser developer tools console for errors
4. Document steps to reproduce issues for faster resolution

---

*This user guide covers all major features of the Release Management Center. For technical implementation details, refer to the Developer Guide.*