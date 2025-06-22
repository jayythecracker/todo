import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Header from "./components/Header";
import NoteList from "./components/NoteList";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

// Main app content that uses auth context
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <NoteList />
            {isAdmin && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Admin Panel
                </h2>
                <AdminPanel />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Root App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
