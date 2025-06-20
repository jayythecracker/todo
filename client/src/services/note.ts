// services/note.ts
import type { Note } from "../types/note";
import axios from "axios";

export const getNotes = async (): Promise<Note[]> => {
  console.log("API_URL:", import.meta.env.VITE_API_URL);

  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/`);
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
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/create`,
      noteData
    );
    console.log("Note created:", response.data);
    return response.data; // Return the created note
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<Note> => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};

export const updateTodo = async (noteData: {
    id:string
  title: string;
  todo: string;
}): Promise<Note> => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_API_URL}/`,noteData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};
