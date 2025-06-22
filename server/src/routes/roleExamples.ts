import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { 
  requireRole, 
  requirePermission, 
  requirePermissions,
  requireModerator,
  requireAdmin,
  requireSuperAdmin 
} from "../middlewares/auth";
import { UserRole, Permission } from "../utils/roles";

const router = Router();

// ✅ SENIOR APPROACH: Multiple Role Examples

// 1. Role-based access (hierarchy)
router.get("/user-only", authenticate, (req, res) => {
  res.json({ 
    message: "Any authenticated user can access this",
    user: (req as any).user 
  });
});

router.get("/moderator-plus", authenticate, requireModerator, (req, res) => {
  res.json({ 
    message: "Moderator, Admin, or Super Admin can access this",
    user: (req as any).user 
  });
});

router.get("/admin-plus", authenticate, requireAdmin, (req, res) => {
  res.json({ 
    message: "Admin or Super Admin can access this",
    user: (req as any).user 
  });
});

router.get("/super-admin-only", authenticate, requireSuperAdmin, (req, res) => {
  res.json({ 
    message: "Only Super Admin can access this",
    user: (req as any).user 
  });
});

// 2. Permission-based access (granular)
router.get("/read-all-users", 
  authenticate, 
  requirePermission(Permission.READ_ALL_USERS), 
  (req, res) => {
    res.json({ 
      message: "User has permission to read all users",
      permission: Permission.READ_ALL_USERS 
    });
  }
);

router.delete("/moderate-content/:id", 
  authenticate, 
  requirePermission(Permission.MODERATE_CONTENT), 
  (req, res) => {
    res.json({ 
      message: `Content ${req.params.id} moderated`,
      permission: Permission.MODERATE_CONTENT 
    });
  }
);

// 3. Multiple permissions required
router.post("/manage-users", 
  authenticate, 
  requirePermissions([
    Permission.READ_ALL_USERS,
    Permission.UPDATE_USER_ROLES,
    Permission.DELETE_USERS
  ]), 
  (req, res) => {
    res.json({ 
      message: "User can fully manage other users",
      permissions: [
        Permission.READ_ALL_USERS,
        Permission.UPDATE_USER_ROLES,
        Permission.DELETE_USERS
      ]
    });
  }
);

// 4. Dynamic role checking
router.get("/dynamic-role/:role", authenticate, (req, res) => {
  const dynamicMiddleware = requireRole(req.params.role as UserRole);
  
  dynamicMiddleware(req, res, () => {
    res.json({ 
      message: `User has ${req.params.role} role or higher`,
      userRole: (req as any).user.role 
    });
  });
});

// 5. Custom authorization logic
router.get("/custom-auth", authenticate, async (req, res) => {
  const user = (req as any).user;
  
  // Custom business logic
  if (user.role === UserRole.ADMIN && user.email.endsWith('@company.com')) {
    res.json({ 
      message: "Company admin access granted",
      user: user 
    });
  } else if (user.role === UserRole.MODERATOR && new Date(user.createdAt) > new Date('2024-01-01')) {
    res.json({ 
      message: "New moderator access granted",
      user: user 
    });
  } else {
    res.status(403).json({ 
      message: "Custom authorization failed",
      code: "CUSTOM_AUTH_FAILED" 
    });
  }
});

// 6. Resource ownership check
router.get("/my-todos", authenticate, async (req, res) => {
  // Users can only see their own todos
  const userId = (req as any).userId;
  
  res.json({ 
    message: "User's own todos",
    userId,
    note: "Users can only access their own resources"
  });
});

router.get("/all-todos", 
  authenticate, 
  requirePermission(Permission.READ_ALL_TODOS), 
  async (req, res) => {
    // Only moderators+ can see all todos
    res.json({ 
      message: "All todos (moderator+ access)",
      permission: Permission.READ_ALL_TODOS
    });
  }
);

// 7. Conditional access based on resource ownership
router.put("/todos/:id", authenticate, async (req, res) => {
  const user = (req as any).user;
  const todoId = req.params.id;
  
  // Check if user owns the todo OR has permission to edit any todo
  const canEdit = 
    // Owner can edit their own
    await checkTodoOwnership(todoId, user._id) ||
    // Moderator+ can edit any
    user.role === UserRole.MODERATOR ||
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN;
  
  if (!canEdit) {
    res.status(403).json({ 
      message: "Cannot edit this todo",
      code: "INSUFFICIENT_ACCESS" 
    });
    return;
  }
  
  res.json({ 
    message: `Todo ${todoId} updated`,
    canEdit: true 
  });
});

// Helper function (would be in a service)
async function checkTodoOwnership(todoId: string, userId: string): Promise<boolean> {
  // In real implementation, check database
  // const todo = await Todo.findById(todoId);
  // return todo?.createdBy.toString() === userId;
  return true; // Placeholder
}

export default router;
