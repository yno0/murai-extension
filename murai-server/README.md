# Murai Server API

A comprehensive Node.js/Express server with MongoDB for user management, group management, activity tracking, and content moderation.

## Features

- **User Management**: Complete CRUD operations for users with role-based access
- **Group Management**: Create and manage groups with supervisors and members
- **Activity Tracking**: Monitor user activities and detect flagged content
- **Content Moderation**: Report system for inappropriate content
- **Preference Management**: User preferences for content filtering
- **Admin Logging**: Comprehensive admin activity logging
- **Address Management**: User address information
- **Group Codes**: Invitation system for group access

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **CORS**: Cross-Origin Resource Sharing enabled
- **Environment**: dotenv for configuration

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd murai-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/murai-db
JWT_SECRET=your-secret-key
```

4. Start the server:
```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require authentication. Include JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": "Response data",
  "count": 10
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## API Endpoints

### 1. Authentication (`/api/auth`)
Authentication endpoints for user login, registration, and token management.

### 2. Users (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all users | Admin only |
| GET | `/:id` | Get user by ID | Private |
| POST | `/` | Create new user | Admin only |
| PUT | `/:id` | Update user | Private |
| DELETE | `/:id` | Delete user | Admin only |

**User Model Fields:**
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, required)
- `role` (String: 'admin', 'user', 'suspended', default: 'user')
- `isPremium` (Boolean, default: false)
- `status` (String: 'active', 'inactive', 'suspended', default: 'active')
- `isVerified` (Boolean, default: false)
- `isActive` (Boolean, default: true)
- `lastActive` (Date)
- `joinedAt` (Date, default: Date.now)
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

### 3. User Information (`/api/user-info`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all user info | Admin only |
| GET | `/:id` | Get user info by ID | Private |
| GET | `/user/:userId` | Get user info by user ID | Private |
| POST | `/` | Create new user info | Private |
| PUT | `/:id` | Update user info | Private |
| DELETE | `/:id` | Delete user info | Admin only |

**UserInfo Model Fields:**
- `userId` (ObjectId, ref: 'User', required, unique)
- `addressId` (ObjectId, ref: 'Address', required)
- `firstName` (String, required)
- `lastName` (String)
- `gender` (String: 'male', 'female', 'other')
- `phoneNumber` (String, required)
- `profilePicture` (String)
- `dateOfBirth` (Date, required)

### 4. Addresses (`/api/addresses`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all addresses | Admin only |
| GET | `/:id` | Get address by ID | Private |
| GET | `/user/:userId` | Get addresses by user ID | Private |
| POST | `/` | Create new address | Private |
| PUT | `/:id` | Update address | Private |
| DELETE | `/:id` | Delete address | Private |

**Address Model Fields:**
- `userId` (ObjectId, ref: 'User', required)
- `addressLine1` (String, required)
- `country` (String, required)
- `region` (String, required)
- `city` (String, required)
- `postalCode` (String, required)

### 5. Groups (`/api/groups`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all groups | Private |
| GET | `/:id` | Get group by ID | Private |
| GET | `/supervisor/:supervisorId` | Get groups by supervisor ID | Private |
| POST | `/` | Create new group | Supervisor/Admin only |
| PUT | `/:id` | Update group | Supervisor/Admin only |
| DELETE | `/:id` | Delete group (soft delete) | Supervisor/Admin only |

**Group Model Fields:**
- `name` (String, required)
- `description` (String)
- `supervisorId` (ObjectId, ref: 'User', required)
- `isActive` (Boolean, default: true)
- `createAt` (Date, auto-generated)
- `updateAt` (Date, auto-generated)

### 6. Group Members (`/api/group-members`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all group members | Private |
| GET | `/:id` | Get group member by ID | Private |
| GET | `/group/:groupId` | Get members by group ID | Private |
| GET | `/user/:userId` | Get groups by user ID | Private |
| POST | `/` | Add user to group | Private |
| DELETE | `/:id` | Remove user from group | Private |
| DELETE | `/user/:userId/group/:groupId` | Remove user from group by IDs | Private |

**GroupMember Model Fields:**
- `userId` (ObjectId, ref: 'User', required)
- `groupId` (ObjectId, ref: 'Group', required)
- `joinedAt` (Date, auto-generated)

### 7. Group Codes (`/api/group-codes`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all group codes | Admin only |
| GET | `/:id` | Get group code by ID | Private |
| GET | `/group/:groupId` | Get group codes by group ID | Private |
| GET | `/group/:groupId/active` | Get active group codes by group ID | Private |
| POST | `/` | Create new group code | Supervisor/Admin only |
| POST | `/validate` | Validate group code | Private |
| PUT | `/:id` | Update group code | Supervisor/Admin only |
| DELETE | `/:id` | Delete group code | Supervisor/Admin only |

**GroupCode Model Fields:**
- `groupId` (ObjectId, ref: 'Group', required)
- `code` (String, required)
- `expiresAt` (Date, required)
- `createAt` (Date, auto-generated)
- `updateAt` (Date, auto-generated)

### 8. Preferences (`/api/preferences`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all preferences | Admin only |
| GET | `/:id` | Get preference by ID | Private |
| GET | `/user/:userId` | Get preference by user ID | Private |
| POST | `/` | Create new preference | Private |
| PUT | `/:id` | Update preference | Private |
| PUT | `/user/:userId` | Update preference by user ID | Private |
| DELETE | `/:id` | Delete preference | Private |

**Preference Model Fields:**
- `userId` (ObjectId, ref: 'User', required)
- `language` (String: 'Taglish', 'English', 'Tagalog')
- `whitelistSite` ([String])
- `whitelistTerms` ([String])
- `flagStyle` (String: 'default', 'custom', 'asterisk', 'underline', 'blur', 'highlight', 'none')
- `isHighlighted` (Boolean, default: false)
- `color` (String, default: '#FF0000')

### 9. Detected Words (`/api/detected-words`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all detected words | Admin only |
| GET | `/stats` | Get detected words statistics | Admin only |
| GET | `/:id` | Get detected word by ID | Private |
| GET | `/activity/:activityLogId` | Get detected words by activity log ID | Private |
| GET | `/word/:word` | Get detected words by word | Private |
| POST | `/` | Create new detected word | Private |
| PUT | `/:id` | Update detected word | Private |
| DELETE | `/:id` | Delete detected word | Private |

**DetectedWord Model Fields:**
- `word` (String, required)
- `context` (String, required)
- `sentimentScore` (Number, required)
- `activityLogId` (ObjectId, ref: 'UserActivity', required)
- `createdAt` (Date, auto-generated)

### 10. User Activities (`/api/user-activities`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all user activities | Admin only |
| GET | `/stats` | Get user activity statistics | Admin only |
| GET | `/:id` | Get user activity by ID | Private |
| GET | `/user/:userId` | Get user activities by user ID | Private |
| GET | `/type/:activityType` | Get user activities by activity type | Private |
| POST | `/` | Create new user activity | Private |
| PUT | `/:id` | Update user activity | Private |
| DELETE | `/:id` | Delete user activity | Private |

**UserActivity Model Fields:**
- `userId` (ObjectId, ref: 'User', required)
- `activityType` (String: 'login', 'logout', 'update', 'visit', 'report', 'group_join', 'group_leave', 'flagged', 'other', required)
- `activityDetails` (String)
- `url` (String)
- `createdAt` (Date, auto-generated)
- `updatedAt` (Date, auto-generated)

### 11. Reports (`/api/reports`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all reports | Admin only |
| GET | `/stats` | Get report statistics | Admin only |
| GET | `/:id` | Get report by ID | Private |
| GET | `/user/:userId` | Get reports by user ID | Private |
| GET | `/status/:status` | Get reports by status | Private |
| POST | `/` | Create new report | Private |
| PUT | `/:id` | Update report | Private |
| PATCH | `/:id/status` | Update report status | Admin only |
| DELETE | `/:id` | Delete report | Admin only |

**Report Model Fields:**
- `userId` (ObjectId, ref: 'User', required)
- `activityLogId` (ObjectId, ref: 'ActivityLog', required)
- `type` (String)
- `description` (String)
- `status` (String: 'pending', 'resolved', 'in_progress', default: 'pending')
- `createAt` (Date, auto-generated)
- `updateAt` (Date, auto-generated)

### 12. Admin Logs (`/api/admin-logs`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Get all admin logs | Admin only |
| GET | `/stats` | Get admin logs statistics | Admin only |
| GET | `/:id` | Get admin log by ID | Admin only |
| GET | `/admin/:adminId` | Get admin logs by admin ID | Admin only |
| GET | `/activity/:activityType` | Get admin logs by activity type | Admin only |
| GET | `/target/:targetType` | Get admin logs by target type | Admin only |
| GET | `/status/:status` | Get admin logs by status | Admin only |
| POST | `/` | Create new admin log | Admin only |
| PUT | `/:id` | Update admin log | Admin only |
| DELETE | `/:id` | Delete admin log | Admin only |

**AdminLogs Model Fields:**
- `adminId` (ObjectId, ref: 'Admin', required)
- `action` (String, required)
- `activityType` (String: 'login', 'logout', 'update', 'visit', 'report', 'group_join', 'group_leave', 'flagged', 'other', required)
- `targetType` (String: 'report', 'user', 'group', 'system', 'other', required)
- `targetId` (ObjectId)
- `details` (String)
- `ipAddress` (String)
- `userAgent` (String)
- `status` (String: 'success', 'failed', 'pending', default: 'success')
- `errorMessage` (String)
- `createdAt` (Date, auto-generated)

## Usage Examples

### Creating a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### Getting User Activities
```bash
curl -X GET http://localhost:3000/api/user-activities/user/64f1a2b3c4d5e6f7g8h9i0j1 \
  -H "Authorization: Bearer <your-token>"
```

### Creating a Group
```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Study Group",
    "description": "A group for studying together",
    "supervisorId": "64f1a2b3c4d5e6f7g8h9i0j1"
  }'
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Secure password handling (recommended to implement hashing)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 