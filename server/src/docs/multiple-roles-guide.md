# Multiple Roles System - Senior Developer Guide

## 🎯 **Your Question: What if role is more than 2?**

When you have more than 2 roles, senior developers implement **Role-Based Access Control (RBAC)** with hierarchy and permissions.

## 🏗️ **Senior Approach: Scalable Role System**

### **1. Role Hierarchy**

```typescript
export enum UserRole {
  USER = "user",           // Level 1 - Basic user
  MODERATOR = "moderator", // Level 2 - Content moderation
  ADMIN = "admin",         // Level 3 - System administration  
  SUPER_ADMIN = "super_admin" // Level 4 - Full system access
}

const ROLE_HIERARCHY = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPER_ADMIN]: 4,
};
```

### **2. Permission-Based System**

```typescript
export enum Permission {
  // User permissions
  READ_OWN_PROFILE = "read_own_profile",
  CREATE_TODO = "create_todo",
  
  // Moderator permissions  
  READ_ALL_TODOS = "read_all_todos",
  MODERATE_CONTENT = "moderate_content",
  
  // Admin permissions
  READ_ALL_USERS = "read_all_users",
  UPDATE_USER_ROLES = "update_user_roles",
  
  // Super Admin permissions
  SYSTEM_MAINTENANCE = "system_maintenance",
  ACCESS_LOGS = "access_logs"
}
```

### **3. Role-Permission Mapping**

```typescript
const ROLE_PERMISSIONS = {
  [UserRole.USER]: [
    Permission.READ_OWN_PROFILE,
    Permission.CREATE_TODO,
  ],
  
  [UserRole.MODERATOR]: [
    ...ROLE_PERMISSIONS[UserRole.USER], // Inherit user permissions
    Permission.READ_ALL_TODOS,
    Permission.MODERATE_CONTENT,
  ],
  
  [UserRole.ADMIN]: [
    ...ROLE_PERMISSIONS[UserRole.MODERATOR], // Inherit moderator permissions
    Permission.READ_ALL_USERS,
    Permission.UPDATE_USER_ROLES,
  ],
  
  [UserRole.SUPER_ADMIN]: [
    ...ROLE_PERMISSIONS[UserRole.ADMIN], // Inherit admin permissions
    Permission.SYSTEM_MAINTENANCE,
    Permission.ACCESS_LOGS,
  ],
};
```

## 🛡️ **Advanced Authorization Patterns**

### **1. Role-Based Middleware**

```typescript
// ✅ Hierarchy-based (user needs minimum role level)
export const requireRole = (requiredRole: UserRole) => {
  return async (req, res, next) => {
    const user = await User.findById(req.userId);
    
    if (ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole]) {
      next(); // User has sufficient role level
    } else {
      res.status(403).json({ message: "Insufficient role" });
    }
  };
};

// Usage examples:
router.get('/moderator-area', requireRole(UserRole.MODERATOR)); // Moderator+
router.get('/admin-panel', requireRole(UserRole.ADMIN));       // Admin+
router.get('/system-logs', requireRole(UserRole.SUPER_ADMIN)); // Super Admin only
```

### **2. Permission-Based Middleware**

```typescript
// ✅ Granular permission checking
export const requirePermission = (permission: Permission) => {
  return async (req, res, next) => {
    const user = await User.findById(req.userId);
    const userPermissions = ROLE_PERMISSIONS[user.role];
    
    if (userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ message: "Insufficient permissions" });
    }
  };
};

// Usage examples:
router.get('/users', requirePermission(Permission.READ_ALL_USERS));
router.delete('/content/:id', requirePermission(Permission.MODERATE_CONTENT));
```

### **3. Multiple Permissions**

```typescript
export const requirePermissions = (permissions: Permission[]) => {
  return async (req, res, next) => {
    const user = await User.findById(req.userId);
    const userPermissions = ROLE_PERMISSIONS[user.role];
    
    const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
    
    if (hasAllPermissions) {
      next();
    } else {
      res.status(403).json({ 
        message: "Missing required permissions",
        required: permissions,
        missing: permissions.filter(p => !userPermissions.includes(p))
      });
    }
  };
};
```

## 🎨 **Frontend Implementation**

### **1. Role-Aware Context**

```typescript
interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isModerator: boolean;
  isSuperAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthProvider = ({ children }) => {
  const roleHierarchy = {
    'user': 1,
    'moderator': 2, 
    'admin': 3,
    'super_admin': 4,
  };

  const hasRole = (requiredRole: UserRole) => {
    if (!user) return false;
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: hasRole('admin'),
      isModerator: hasRole('moderator'),
      isSuperAdmin: hasRole('super_admin'),
      hasRole,
      hasAnyRole: (roles) => roles.some(role => hasRole(role)),
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **2. Conditional UI Rendering**

```typescript
const Dashboard = () => {
  const { user, hasRole, hasAnyRole } = useAuth();

  return (
    <div>
      {/* Everyone sees this */}
      <UserProfile />
      
      {/* Moderator+ sees this */}
      {hasRole('moderator') && (
        <ModerationPanel />
      )}
      
      {/* Admin+ sees this */}
      {hasRole('admin') && (
        <AdminPanel />
      )}
      
      {/* Super Admin only */}
      {hasRole('super_admin') && (
        <SystemMaintenancePanel />
      )}
      
      {/* Multiple roles */}
      {hasAnyRole(['admin', 'super_admin']) && (
        <AdvancedSettings />
      )}
    </div>
  );
};
```

### **3. Role-Based Components**

```typescript
const RoleGuard = ({ 
  requiredRole, 
  children, 
  fallback = null 
}: {
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const { hasRole } = useAuth();
  
  return hasRole(requiredRole) ? children : fallback;
};

// Usage
<RoleGuard requiredRole="moderator">
  <ModerationTools />
</RoleGuard>

<RoleGuard 
  requiredRole="admin" 
  fallback={<div>Admin access required</div>}
>
  <AdminDashboard />
</RoleGuard>
```

## 🚀 **Real-World Examples**

### **1. Content Management System**

```typescript
// Routes with different access levels
router.get('/posts', authenticate); // Anyone can read
router.post('/posts', requireRole(UserRole.USER)); // Users can create
router.delete('/posts/:id', requirePermission(Permission.MODERATE_CONTENT)); // Moderators can delete
router.get('/analytics', requireRole(UserRole.ADMIN)); // Admins see analytics
router.post('/backup', requireRole(UserRole.SUPER_ADMIN)); // Super admins manage backups
```

### **2. E-commerce Platform**

```typescript
const roles = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor', 
  SUPPORT: 'support',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

// Customer: Browse, buy
// Vendor: Manage own products
// Support: Handle tickets
// Manager: View reports, manage vendors
// Admin: Full system access
```

### **3. Educational Platform**

```typescript
const roles = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  COORDINATOR: 'coordinator',
  PRINCIPAL: 'principal',
  ADMIN: 'admin'
};

// Student: View courses, submit assignments
// Teacher: Create courses, grade assignments
// Coordinator: Manage teachers, view reports
// Principal: School-wide oversight
// Admin: System administration
```

## 📊 **Best Practices**

### **1. Role Design Principles**

- **Hierarchy**: Higher roles inherit lower role permissions
- **Granularity**: Use permissions for fine-grained control
- **Separation**: Keep roles and permissions separate
- **Extensibility**: Easy to add new roles/permissions

### **2. Security Considerations**

```typescript
// ✅ Always check on server-side
router.delete('/users/:id', authenticate, requireRole(UserRole.ADMIN), deleteUser);

// ✅ Validate resource ownership
const canEdit = user.id === resource.ownerId || hasRole('moderator');

// ✅ Log sensitive operations
if (hasRole('admin')) {
  logger.info(`Admin ${user.id} accessed user management`);
}
```

### **3. Database Design**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP
);

-- Optional: Role-based permissions table for complex systems
CREATE TABLE role_permissions (
  role VARCHAR,
  permission VARCHAR,
  PRIMARY KEY (role, permission)
);
```

## 🎯 **Migration Strategy**

If you're upgrading from 2 roles to multiple roles:

```typescript
// 1. Update database schema
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'moderator', 'admin', 'super_admin');

// 2. Migrate existing data
UPDATE users SET role = 'admin' WHERE role = 'admin';
UPDATE users SET role = 'user' WHERE role = 'user';

// 3. Update middleware gradually
// Keep old middleware for backward compatibility
export const authorize = requireRole(UserRole.ADMIN); // Legacy
export const requireAdmin = requireRole(UserRole.ADMIN); // New
```

This approach scales from 2 roles to any number of roles while maintaining security and flexibility! 🚀
