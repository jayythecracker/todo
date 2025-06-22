import dotenv from "dotenv";
import { connectDB } from "../db/connectDB";
import User from "../models/user";
import mongoose from "mongoose";

// Load environment variables
dotenv.config({
  path: ".env",
});

interface AdminConfig {
  name: string;
  email: string;
  password: string;
  profile_photo?: string;
}

export const createAdminUser = async (config?: Partial<AdminConfig>) => {
  try {
    const adminData: AdminConfig = {
      name: config?.name || process.env.ADMIN_NAME || "Admin User",
      email: config?.email || process.env.ADMIN_EMAIL || "admin@example.com",
      password: config?.password || process.env.ADMIN_PASSWORD || "admin123456",
      profile_photo: config?.profile_photo || process.env.ADMIN_PROFILE_PHOTO,
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminData.email} already exists!`);
      return existingAdmin;
    }

    // Create admin user
    const admin = await User.create({
      ...adminData,
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    return admin;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
};

export const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("🔗 Connected to database for seeding...");

    // Create admin user
    const admin = await createAdminUser();

    console.log("👤 Admin details:", admin.toJSON());
    console.log("\n🔐 Default login credentials:");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || "admin123456"}`);
    console.log("\n⚠️  Please change the default password after first login!");

    return { admin };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

// CLI execution
const runSeed = async () => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
    process.exit(0);
  }
};

// Check if this file is being run directly
if (require.main === module) {
  runSeed();
}
