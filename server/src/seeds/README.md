# Database Seeding

This directory contains scripts for seeding the database with initial data.

## Admin User Seeding

### Quick Start

To create an admin user with default credentials:

```bash
npm run seed:admin
```

Or run the comprehensive seed script:

```bash
npm run seed
```

### Environment Variables

You can customize the admin user by setting these environment variables in your `.env` file:

```env
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
ADMIN_PROFILE_PHOTO=https://example.com/admin-photo.jpg
```

### Default Credentials

If no environment variables are set, the following default admin user will be created:

- **Name**: Admin User
- **Email**: admin@example.com
- **Password**: admin123456
- **Role**: admin

⚠️ **Security Warning**: Please change the default password after first login!

### Features

- ✅ Checks if admin already exists before creating
- ✅ Uses environment variables for configuration
- ✅ Automatically excludes password from JSON responses
- ✅ Proper error handling and logging
- ✅ Graceful database connection management

### Usage Examples

#### Create admin with custom data programmatically:

```typescript
import { createAdminUser } from './seeds';

const admin = await createAdminUser({
  name: "Super Admin",
  email: "superadmin@company.com",
  password: "securePassword123"
});
```

#### Run full database seeding:

```typescript
import { seedDatabase } from './seeds';

await seedDatabase();
```

### Files

- `adminSeed.ts` - Simple admin seeding script
- `index.ts` - Comprehensive seeding with utilities
- `README.md` - This documentation

### Security Notes

1. Always change default passwords in production
2. Use strong passwords for admin accounts
3. Consider using environment-specific configurations
4. Passwords are automatically hashed using bcrypt
5. Passwords are excluded from all JSON responses
