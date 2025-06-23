// services/note.ts
import type { Note } from "../types/note";
import authApi from "./auth";

export const getNotes = async (): Promise<Note[]> => {
  try {
    // Use the todo routes (assuming they're at the root level)
    const response = await authApi.get("/todos");
    console.log("API Response:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
};

// Updated to accept an object and return the created note
export const createNote = async (noteData: {
  title: string;
  todo: string;
}): Promise<Note> => {
  try {
    console.log("Creating note with data:", noteData);
    const response = await authApi.post("/todos/create", noteData);
    console.log("Note created:", response.data);
    return response.data.data; // Return the actual note from the nested data structure
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<Note> => {
  try {
    const response = await authApi.delete(`/todos/${id}`);
    console.log("Delete response:", response.data);
    // Check if response has nested data structure
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

export const updateTodo = async (noteData: {
  id: string;
  title: string;
  todo: string;
}): Promise<Note> => {
  try {
    const response = await authApi.patch("/todos/", noteData);
    console.log("Update response:", response.data);
    // Check if response has nested data structure
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};
