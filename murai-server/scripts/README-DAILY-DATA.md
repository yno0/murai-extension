# MURAi Daily Data Generation Scripts

This directory contains scripts for generating daily data for the MURAi admin dashboard and monitoring system.

## Available Scripts

### 1. `runDailyDataGeneration.js` (Recommended)
**Purpose**: Generate today's data including detection reports, user activities, groups with members, and notifications.

**Features**:
- Creates detection reports for today
- Generates user activities 
- Creates new groups with members
- Generates reports and notifications
- Special focus on rblatco@gmail.com with enhanced data
- Lightweight and focused on today's data only

**Usage**:
```bash
# From murai-server directory
npm run daily-data

# Or directly
node scripts/runDailyDataGeneration.js

# Or use the batch file (Windows)
run-daily-data.bat
```

### 2. `generateTodayData.js` (Comprehensive)
**Purpose**: Comprehensive data generation including new users, groups, and extensive data sets.

**Features**:
- Creates new users for today
- Generates extensive detection reports
- Creates groups with members and codes
- Generates comprehensive user activities
- Creates reports and notifications
- More comprehensive but takes longer to run

**Usage**:
```bash
# From murai-server directory
npm run generate-today-data

# Or directly
node scripts/generateTodayData.js
```

## What Data Gets Generated

### For rblatco@gmail.com specifically:
- ✅ 15 detection reports for today
- ✅ 12 user activities for today
- ✅ Enhanced admin-level data
- ✅ Updated last active time

### For other users:
- ✅ 5-10 detection reports per user
- ✅ 4-8 user activities per user
- ✅ Group memberships

### System-wide data:
- ✅ 5 new user reports
- ✅ 2 new groups with 3-6 members each
- ✅ Group codes and access management
- ✅ Notifications for all active users

## Data Types Generated

### Detection Reports
- Harmful words detected (English, Tagalog, Taglish)
- Context information (Facebook, Twitter, Instagram, etc.)
- Sentiment scores, accuracy, response times
- Pattern types (profanity, harassment, toxicity, hate speech)
- Severity levels (medium, high)

### User Activities
- Login/logout events
- Profile updates
- Website visits with monitoring
- Content reports submitted
- Group join/leave activities
- Content flagging events

### Groups and Members
- New monitoring groups created
- Group codes generated (30-day expiry)
- Members added to groups
- Group admin assignments

### Reports and Notifications
- False positive/negative reports
- Daily security alerts
- Content moderation feedback
- System notifications

## Requirements

- Node.js environment
- MongoDB connection (configured in .env)
- All required dependencies installed (`npm install`)

## Environment Setup

Make sure your `.env` file contains:
```
MONGO_URI=your_mongodb_connection_string
```

## Quick Start

1. Navigate to murai-server directory:
   ```bash
   cd murai-server
   ```

2. Run daily data generation:
   ```bash
   npm run daily-data
   ```

3. Check the console output for statistics and confirmation

## Scheduling

You can schedule these scripts to run automatically:

### Windows Task Scheduler
- Use `run-daily-data.bat` 
- Schedule to run daily at desired time

### Linux/Mac Cron
```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * cd /path/to/murai-server && npm run daily-data
```

## Troubleshooting

### Common Issues:
1. **MongoDB Connection Error**: Check your MONGO_URI in .env file
2. **Missing Dependencies**: Run `npm install` in murai-server directory
3. **Permission Errors**: Ensure proper file permissions for scripts

### Logs and Output:
- Scripts provide detailed console output
- Success/error messages for each operation
- Final statistics summary

## Notes

- Scripts are designed to be run multiple times safely
- Existing data is not duplicated
- rblatco@gmail.com user is created if it doesn't exist
- All timestamps are set to today's date with random times
- Data is realistic and follows actual usage patterns

## Support

For issues or questions about these scripts, check:
1. Console output for specific error messages
2. MongoDB connection and permissions
3. Node.js version compatibility
4. Required dependencies installation
