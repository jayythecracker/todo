import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, hasRole } = useAuth();

  const getRoleBadge = (role: string) => {
    const badges = {
      user: { text: "User", color: "bg-green-100 text-green-800" },
      moderator: { text: "Moderator", color: "bg-blue-100 text-blue-800" },
      admin: { text: "Admin", color: "bg-purple-100 text-purple-800" },
      super_admin: { text: "Super Admin", color: "bg-red-100 text-red-800" },
    };
    return badges[role as keyof typeof badges] || badges.user;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show header if not authenticated
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Simple Todos
            </h1>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {user?.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500">
                  {user?.email}
                  {user?.role && user.role !== "user" && (
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        getRoleBadge(user.role).color
                      }`}
                    >
                      {getRoleBadge(user.role).text}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
