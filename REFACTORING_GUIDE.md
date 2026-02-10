# Code Refactoring Guide

This document explains the utilities and patterns introduced to eliminate code duplication and improve maintainability.

## Backend Utilities

### 1. Password Helper (`backend/utils/passwordHelper.js`)

Centralized password management utilities to ensure consistent and secure password handling.

#### Usage

```javascript
const { hashPassword, comparePassword, generateRandomPassword, validatePasswordStrength } = require('../utils/passwordHelper');

// Hash a password
const hashedPassword = await hashPassword('userPassword123');

// Compare password with hash
const isValid = await comparePassword('userPassword123', hashedPassword);

// Generate secure random password
const randomPassword = generateRandomPassword(16); // 16 characters

// Validate password strength
const validation = validatePasswordStrength('Weak123');
if (!validation.valid) {
  console.log(validation.message); // Password must contain at least one special character
}
```

#### Key Features
- **Secure Hashing**: Uses bcrypt with 10 salt rounds
- **Cryptographically Secure Random**: Uses `crypto.randomInt()` instead of `Math.random()`
- **Password Validation**: Enforces minimum length, uppercase, lowercase, numbers
- **Consistent API**: Same interface across all controllers

### 2. CRUD Handler (`backend/utils/crudHandler.js`)

Generic handlers for common CRUD operations with pagination, filtering, and error handling.

#### Usage

```javascript
const { createPaginatedListHandler, createGetByIdHandler, createAuditLog } = require('../utils/crudHandler');
const MyModel = require('../models/myModel');
const AuditLog = require('../models/auditLog');

// Create paginated list endpoint
exports.getAll = createPaginatedListHandler(MyModel, {
  searchFields: ['name', 'email', 'code'],
  filterFields: ['status', 'category'],
  defaultSortBy: 'createdAt',
  populate: ['vendor', 'user']
});

// Create get-by-id endpoint
exports.getById = createGetByIdHandler(MyModel, {
  populate: ['vendor', 'user'],
  select: '-password'
});

// Create audit log
await createAuditLog(AuditLog, {
  action: 'user_created',
  performed_by: req.user.id,
  details: { user_id: newUser._id }
});
```

#### Key Features
- **Pagination**: Built-in skip/limit with page info
- **Filtering**: Automatic query building from request params
- **Sorting**: Configurable sort fields and directions
- **Population**: Mongoose populate support
- **Audit Logging**: Simplified audit log creation
- **Error Handling**: Consistent error responses

### 3. Audit Log Helper

Eliminates repetitive audit log creation code.

#### Before
```javascript
const auditLog = new AuditLog({
  action: 'user_created',
  performed_by: req.user.id,
  details: { user_id: newUser._id },
  timestamp: new Date()
});
await auditLog.save();
```

#### After
```javascript
await createAuditLog(AuditLog, {
  action: 'user_created',
  performed_by: req.user.id,
  details: { user_id: newUser._id }
});
```

**Saves**: 4 lines per audit log × ~50 instances = ~200 LOC

---

## Frontend Utilities

### API Client (`src/utils/apiClient.ts`)

Unified API client wrapper with consistent error handling and response parsing.

#### Usage

```typescript
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../utils/apiClient';

// GET request with query parameters
const users = await apiGet<User[]>('/users', { 
  page: 1, 
  limit: 10, 
  status: 'active' 
}, 'Failed to fetch users');

// POST request
const newUser = await apiPost<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, 'Failed to create user');

// PUT request
const updatedUser = await apiPut<User>(`/users/${id}`, {
  name: 'Jane Doe'
}, 'Failed to update user');

// PATCH request
const patchedUser = await apiPatch<User>(`/users/${id}`, {
  status: 'inactive'
}, 'Failed to patch user');

// DELETE request
await apiDelete(`/users/${id}`, 'Failed to delete user');
```

#### Key Features
- **Automatic Error Handling**: Consistent error message extraction
- **Type Safety**: Full TypeScript support
- **Query Parameter Building**: Automatic URL encoding with empty value filtering
- **Response Parsing**: Unwraps `response.data.data` automatically
- **Simplified Service Code**: Reduces service methods from 15-20 lines to 1-3 lines

### API Client Class

For RESTful resources, use the `ApiClient` class:

```typescript
import { ApiClient } from '../utils/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
}

const userClient = new ApiClient<User>('/users');

// Use built-in CRUD methods
const users = await userClient.getAll({ status: 'active' });
const user = await userClient.getById('123');
const newUser = await userClient.create({ name: 'John', email: 'john@example.com' });
const updated = await userClient.update('123', { name: 'Jane' });
await userClient.delete('123');
```

---

## Migration Guide

### Migrating a Controller to Use Password Helper

1. **Replace imports**:
```javascript
// Before
const bcrypt = require('bcryptjs');

// After
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
```

2. **Replace password hashing**:
```javascript
// Before
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// After
const hashedPassword = await hashPassword(password);
```

3. **Replace password comparison**:
```javascript
// Before
const isValid = await bcrypt.compare(password, user.password);

// After
const isValid = await comparePassword(password, user.password);
```

### Migrating a Controller to Use Audit Log Helper

1. **Add import**:
```javascript
const { createAuditLog } = require('../utils/crudHandler');
```

2. **Replace audit log creation**:
```javascript
// Before
const auditLog = new AuditLog({
  action: 'user_created',
  performed_by: req.user.id,
  details: { user_id: newUser._id },
  timestamp: new Date()
});
await auditLog.save();

// After
await createAuditLog(AuditLog, {
  action: 'user_created',
  performed_by: req.user.id,
  details: { user_id: newUser._id }
});
```

### Migrating a Service to Use API Client

1. **Replace imports**:
```typescript
// Before
import api from './api';

// After
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiClient';
```

2. **Simplify service methods**:
```typescript
// Before
async getUsers(params?: UserQueryParams): Promise<User[]> {
  try {
    const queryParams = new URLSearchParams(params as Record<string, string> || {}).toString();
    const response = await api.get<ApiResponse<User[]>>(`/users?${queryParams}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Failed to fetch users');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    throw new Error(errorMessage);
  }
}

// After
async getUsers(params?: UserQueryParams): Promise<User[]> {
  return apiGet<User[]>('/users', params, 'Failed to fetch users');
}
```

---

## Performance Benefits

1. **Reduced Bundle Size**: ~335 LOC eliminated
2. **Faster Development**: Copy-paste reduced, consistent patterns
3. **Easier Maintenance**: Change once, apply everywhere
4. **Better Security**: Cryptographic random for passwords
5. **Fewer Bugs**: Single source of truth for common operations
6. **Type Safety**: Full TypeScript support in frontend utilities

---

## Best Practices

### Backend
- ✅ Always use `hashPassword()` for password hashing
- ✅ Always use `comparePassword()` for password verification
- ✅ Use `createAuditLog()` for all audit logging
- ✅ Consider using CRUD handlers for new controllers
- ✅ Validate input before passing to utilities

### Frontend
- ✅ Always use API client wrapper for API calls
- ✅ Provide descriptive error messages
- ✅ Use TypeScript types for type safety
- ✅ Handle errors at the component level
- ✅ Use `ApiClient` class for RESTful resources

---

## Future Enhancements

### Planned Improvements
1. **More CRUD handlers**: Expand to cover all 31+ controllers
2. **Service layer completion**: Migrate all 18 frontend services
3. **Modal components**: Create BaseModal and useModalData hook
4. **Unit tests**: Add tests for all utility functions
5. **Documentation**: Expand JSDoc comments

### How to Contribute
1. Identify duplicated code patterns
2. Extract to utility function
3. Update existing code to use utility
4. Add tests
5. Update documentation

---

## Questions?

For questions or suggestions, please:
- Open an issue on GitHub
- Discuss in team meetings
- Update this document with new patterns

---

Last Updated: 2026-02-10
