import { useEffect, useState } from "react";
import { createNote, deleteNote, getNotes, updateTodo } from "../services/note";
import type { Note } from "../types/note";
import { FloatingActionButton } from "./FloatingActionButton";

const NoteList = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [todo, setTodo] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [showInput, setShowInput] = useState<boolean>(false);

  // Edit mode state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notes");
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setTodo("");
    setEditingNoteId(null);
    setIsEditMode(false);
    setError(null);
  };

  const startEditNote = (note: Note) => {
    setTitle(note.title);
    setTodo(note.todo);
    setEditingNoteId(note._id);
    setIsEditMode(true);
    setError(null);

    // Scroll to form
    const form = document.getElementById("note-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !todo.trim()) {
      alert("Please fill in both title and note");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditMode && editingNoteId) {
        // Update existing note
        await updateTodo({
          id: editingNoteId,
          title: title.trim(),
          todo: todo.trim(),
        });

        // Update the note in the local state optimistically
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note._id === editingNoteId
              ? { ...note, title: title.trim(), todo: todo.trim() }
              : note
          )
        );
      } else {
        // Create new note
        await createNote({ title: title.trim(), todo: todo.trim() });

        // Refresh notes list
        await fetchNotes();
      }

      resetForm();
    } catch (err) {
      console.error("Error saving note:", err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${
              isEditMode ? "update" : "create"
            } note. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(id));
      await deleteNote(id);
      setNotes((prevNotes) => prevNotes.filter((note) => note._id !== id));

      // If we're editing the note being deleted, reset the form
      if (editingNoteId === id) {
        resetForm();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      setError("Failed to delete note. Please try again.");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-gray-600">
          <svg
            className="w-6 h-6 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Loading notes...
        </div>
      </div>
    );
  }

  if (error && notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error loading notes
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchNotes}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <p className="text-gray-600 mt-1">
            {notes.length === 0
              ? "No notes yet"
              : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
          </p>
        </div>
        <button
          onClick={fetchNotes}
          disabled={loading}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Add/Edit Note Form */}
      {showInput || isEditMode ? (
        <div
          id="note-form"
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8 "
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? "Edit Note" : "Add New Note"}
            </h2>
            {isEditMode && (
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Cancel editing"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="todo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Note
              </label>
              <textarea
                id="todo"
                placeholder="Enter your note content"
                value={todo}
                onChange={(e) => setTodo(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !todo.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                  ? "Update Note"
                  : "Add Note"}
              </button>

              {isEditMode && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <></>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No notes yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Get started by creating your first note using the form above.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes
            .sort((a: Note, b: Note) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB.getTime() - dateA.getTime();
            })
            .map((note) => {
              const isDeleting = deletingIds.has(note._id);
              const isBeingEdited = editingNoteId === note._id;

              return (
                <div
                  key={note._id}
                  className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
                    isDeleting ? "opacity-50 pointer-events-none" : ""
                  } ${
                    isBeingEdited
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed line-clamp-4">
                    {note.todo}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "No date"}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => startEditNote(note)}
                          title="Edit note"
                          disabled={isSubmitting}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          onClick={() => handleDeleteNote(note._id)}
                          disabled={isDeleting}
                          title={isDeleting ? "Deleting..." : "Delete note"}
                        >
                          {isDeleting ? (
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
      <FloatingActionButton
        onClick={() => {
          setShowInput(!showInput);
        }}
      />
    </div>
  );
};

export default NoteList;
