# Feature Documentation

## Core Features

### 1. Authentication System

**Login Page**
- Secure username/password authentication
- Session management with localStorage
- Login timestamp tracking
- First and last activity time recording

**Registration**
- New user account creation
- Username uniqueness validation
- Instant account activation

**Session Tracking**
- Login date and time capture
- Activity timestamp updates
- Session persistence across page refreshes
- Logout functionality

### 2. Company Information Management

**Data Collection**
- Company Name
- Company Address (multi-line)
- Auditor/Operator Name

**Data Usage**
- Displayed in dashboard header
- Included in all CSV exports
- Stored with each machine data entry
- Persistent across sessions

### 3. Machine Selection System

**Three-Tier Dropdown Hierarchy**

**Level 1: Plant/Department**
- Plant A - Dyeing
- Plant B - Finishing
- Plant C - Processing
- Utility Section
- Compressor House

**Level 2: Machine Type** (Dynamic based on plant)
- Jet Machine
- Jigger Machine
- Stenter Machine
- Calendering Machine
- Air Compressor
- And more...

**Level 3: Machine Name** (Auto-generated)
- Machine Type 1, 2, 3... up to 10
- Unique identification per machine

**Features**
- Cascading dropdowns (selection flows top to bottom)
- Dynamic loading based on parent selection
- Easy to extend with new machines
- Maintains machine hierarchy

### 4. Data Entry Form

**Manual Input Fields**
- Frequency (Hz) - decimal precision
- Rated kW - 3 decimal places
- Rated HP - 2 decimal places
- Voltage (V) - 1 decimal place
- Current (I) - 2 decimal places
- Power Factor - 3 decimal places (0-1 range)
- Notes - optional text field

**Input Validation**
- Required field validation
- Number type enforcement
- Range validation (e.g., PF between 0-1)
- Real-time error feedback

**User Experience**
- Clean, minimal interface
- Logical field grouping
- Responsive grid layout
- Clear labels and placeholders

### 5. Auto-Calculation Engine

**Real-Time Calculations**

All calculations update instantly as you type:

1. **kVA (Apparent Power)**
   ```
   kVA = √3 × V × I / 1000
   ```

2. **kW (Real Power)**
   ```
   kW = √3 × V × I × PF / 1000
   ```

3. **kVAr (Reactive Power)**
   ```
   kVAr = √(kVA² - kW²)
   ```

4. **Calculated Power**
   ```
   Calculated Power = kW
   ```

5. **Load Factor**
   ```
   Load Factor = Calculated Power / Rated kW
   ```

**Display**
- Highlighted in blue box
- 2-4 decimal precision
- Updates in real-time
- No manual calculation needed

### 6. Data Storage & Retrieval

**MongoDB Collections**

**Users Collection**
- Username (unique)
- Password (plain text - upgrade to bcrypt for production)
- Created timestamp

**Sessions Collection**
- Username
- Login date/time
- First activity time
- Last activity time
- Session timestamp

**Machine Data Collection**
- User information
- Company information
- Machine selection (plant, type, name)
- All input parameters
- All calculated values
- Timestamp
- Optional notes

**Data Retrieval**
- Filter by username
- Filter by plant
- Filter by machine type
- Filter by machine name
- Sort by timestamp (newest first)

### 7. Dashboard

**Header Section**
- Platform title
- Company name and auditor
- Current user
- Login date/time
- Logout button

**Summary Cards**
- Total Records: Count of all entries
- Average Load Factor: Mean across all machines
- Total Power: Sum of calculated power (kW)

**Features**
- Real-time statistics
- Color-coded cards (blue theme)
- Responsive grid layout

### 8. Data Table

**Display Features**
- Paginated table view
- Sortable columns
- Responsive horizontal scroll
- Hover effects on rows
- Color-coded headers (blue)

**Columns Displayed**
- Date/Time
- Plant
- Machine Name
- Frequency
- Voltage
- Current
- kW
- Power Factor
- Load Factor (highlighted)

**Search & Filter**
- Text search (searches across machine name, plant, type)
- Filter by plant dropdown
- Filter by machine type dropdown
- Real-time filtering
- Clear filter options

**Actions**
- Refresh button (reload data)
- Export CSV button

### 9. CSV Export

**Export Features**
- One-click export
- Includes filtered data only
- Comprehensive headers
- Timestamp in filename

**CSV Structure**

**Header Section** (First 9 lines)
```
Energy Audit Report
Company: [Company Name]
Address: [Company Address]
Auditor: [Auditor Name]
User: [Username]
Login Date: [Date]
Login Time: [Time]
Export Date: [Current Date/Time]
Total Records: [Count]
```

**Data Section**
- All machine parameters
- All calculated values
- Timestamps
- Notes
- Company info per row

**Filename Format**
```
energy-audit-YYYY-MM-DD-HHmmss.csv
```

### 10. Responsive Design

**Breakpoints**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Optimizations**
- Single column forms
- Stacked cards
- Horizontal scroll tables
- Touch-friendly buttons
- Readable font sizes

**Tablet Optimizations**
- 2-column grids
- Optimized spacing
- Balanced layouts

**Desktop Optimizations**
- Multi-column grids
- Wide table views
- Maximum data density

### 11. Real-Time Updates

**Instant Feedback**
- Calculations update as you type
- Form validation on blur
- Success messages after save
- Error messages on failure

**Auto-Refresh**
- Manual refresh button
- Data reloads after submission
- Statistics recalculate automatically

## Technical Features

### Performance
- Next.js 15 with App Router
- Server-side rendering
- Optimized bundle size
- Fast page loads
- Efficient MongoDB queries

### Security
- Session-based authentication
- Environment variable protection
- Input validation
- XSS prevention (React default)
- CSRF protection (Next.js default)

### Scalability
- MongoDB indexing ready
- Pagination support (future)
- API route optimization
- Component-based architecture
- Easy to extend

### Developer Experience
- TypeScript for type safety
- Modular component structure
- Reusable utility functions
- Clear file organization
- Comprehensive documentation

## Future Features (Roadmap)

### Phase 1: Enhanced Data Management
- [ ] Edit existing records
- [ ] Delete records
- [ ] Bulk operations
- [ ] Data validation rules
- [ ] Duplicate detection

### Phase 2: Advanced Analytics
- [ ] Charts and graphs (Chart.js/Recharts)
- [ ] Trend analysis
- [ ] Comparison views
- [ ] Energy consumption patterns
- [ ] Anomaly detection

### Phase 3: Reporting
- [ ] PDF report generation
- [ ] Custom report templates
- [ ] Scheduled reports
- [ ] Email delivery
- [ ] Report history

### Phase 4: IoT Integration
- [ ] Live sensor data
- [ ] Real-time monitoring
- [ ] Automated data collection
- [ ] Alert system
- [ ] Dashboard widgets

### Phase 5: Multi-User & Permissions
- [ ] User roles (Admin, Operator, Viewer)
- [ ] Permission management
- [ ] Team collaboration
- [ ] Audit logs
- [ ] User activity tracking

### Phase 6: AI & Machine Learning
- [ ] Predictive maintenance
- [ ] Energy optimization suggestions
- [ ] Pattern recognition
- [ ] Automated insights
- [ ] Cost analysis

### Phase 7: Mobile App
- [ ] React Native app
- [ ] Offline mode
- [ ] Camera integration (OCR)
- [ ] Push notifications
- [ ] Barcode scanning

### Phase 8: Integration
- [ ] REST API
- [ ] Webhook support
- [ ] Third-party integrations
- [ ] Export to ERP systems
- [ ] Cloud storage sync

## Configuration Options

### Machine Configuration
Edit `lib/machineConfig.ts` to:
- Add new plants
- Add new machine types
- Modify machine naming
- Adjust machine count

### Calculation Logic
Edit `lib/calculations.ts` to:
- Modify formulas
- Add new calculations
- Change precision
- Add validation

### Theme Customization
Edit Tailwind classes to:
- Change primary color (blue)
- Adjust spacing
- Modify fonts
- Update borders

### Database Schema
Extend `lib/types.ts` to:
- Add new fields
- Modify data structures
- Add relationships
- Create new collections

## Best Practices

### Data Entry
1. Select machine before entering data
2. Enter all required fields
3. Verify auto-calculations
4. Add notes for context
5. Submit and verify in table

### Data Management
1. Export CSV regularly for backups
2. Use filters to find specific data
3. Review statistics for insights
4. Clean up test data
5. Monitor database size

### Performance
1. Index frequently queried fields
2. Limit data retrieval
3. Use pagination for large datasets
4. Optimize images and assets
5. Monitor API response times

### Security
1. Use strong passwords
2. Keep MongoDB URI secret
3. Enable IP whitelist
4. Regular backups
5. Update dependencies
