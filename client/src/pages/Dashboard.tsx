import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService, type User } from "../services/auth";
import { getNotes, createNote, deleteNote, updateTodo } from "../services/note";
import type { Note } from "../types/note";

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", todo: "" });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndNotes();
  }, []);

  const loadUserAndNotes = async () => {
    try {
      setLoading(true);
      const [userProfile, userNotes] = await Promise.all([
        AuthService.getProfile(),
        getNotes(),
      ]);
      setUser(userProfile);
      setNotes(userNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Even if logout fails, redirect to login
      navigate("/login");
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.todo.trim()) return;

    try {
      const createdNote = await createNote(newNote);
      setNotes((prev) => [createdNote, ...prev]);
      setNewNote({ title: "", todo: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((note) => note._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    try {
      const updatedNote = await updateTodo({
        id: editingNote._id,
        title: editingNote.title,
        todo: editingNote.todo,
      });
      setNotes((prev) =>
        prev.map((note) => (note._id === updatedNote._id ? updatedNote : note))
      );
      setEditingNote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  console.log(user);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              {user && (
                <p className="text-sm text-gray-600">
                  Welcome back, {user.name}! ({user.role})
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Create Note Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Create New Note
          </h2>
          <form onSubmit={handleCreateNote} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) =>
                  setNewNote((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <textarea
                placeholder="Note content..."
                value={newNote.todo}
                onChange={(e) =>
                  setNewNote((prev) => ({ ...prev, todo: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create Note
            </button>
          </form>
        </div>

        {/* Notes List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Your Notes ({notes.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {notes.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No notes yet. Create your first note above!
              </div>
            ) : (
              notes.map((note) => (
                <div key={note._id} className="px-6 py-4">
                  {editingNote?._id === note._id ? (
                    <form onSubmit={handleUpdateNote} className="space-y-3">
                      <input
                        type="text"
                        value={editingNote?.title || ""}
                        onChange={(e) =>
                          setEditingNote((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <textarea
                        value={editingNote?.todo || ""}
                        onChange={(e) =>
                          setEditingNote((prev) =>
                            prev ? { ...prev, todo: e.target.value } : null
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNote(null)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {note.title}
                          </h3>
                          <p className="mt-1 text-gray-600">{note.todo}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            Created:{" "}
                            {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
