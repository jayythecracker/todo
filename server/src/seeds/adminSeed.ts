import dotenv from "dotenv";
import { connectDB } from "../db/connectDB";
import User from "../models/user";

// Load environment variables
dotenv.config({
  path: ".env",
});

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database for seeding...");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL || "admin@example.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log(`Admin email: ${existingAdmin.email}`);
      console.log(`Admin role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      name: process.env.ADMIN_NAME || "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      password: process.env.ADMIN_PASSWORD || "admin123456",
      role: "admin",
      profile_photo: process.env.ADMIN_PROFILE_PHOTO || undefined,
    };

    const admin = await User.create(adminData);

    console.log("✅ Admin user created successfully!");
    console.log("Admin details:", admin.toJSON());
    console.log("\n🔐 Login credentials:");
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log("\n⚠️  Please change the default password after first login!");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
  } finally {
    // Close database connection
    process.exit(0);
  }
};

// Run the seed function
seedAdmin();
