"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTodo = exports.getTodo = exports.deleteTodo = exports.getAll = exports.createTdo = void 0;
const todo_1 = require("../models/todo");
const createTdo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, todo } = req.body;
        const newTodo = yield todo_1.Todo.create({
            title,
            todo,
        });
        res.status(201).json({ message: "New Todo created!", data: newTodo });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});
exports.createTdo = createTdo;
const getAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todos = yield todo_1.Todo.find({});
        res.status(200).json({ message: "All Todos", data: todos });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});
exports.getAll = getAll;
const deleteTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleteTdo = yield todo_1.Todo.findByIdAndDelete(id);
        res.status(200).json({ message: "Deleted Todo", data: deleteTdo });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});
exports.deleteTodo = deleteTodo;
const getTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const single = yield todo_1.Todo.findById(id);
        res.status(200).json({ message: "Single Get", data: single });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});
exports.getTodo = getTodo;
const updateTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, todo, title } = req.body;
        const single = yield todo_1.Todo.findByIdAndUpdate(id, { todo, title });
        res.status(200).json({ message: "Update Todo", data: single });
    }
    catch (error) {
        res.status(500).json({ message: error });
    }
});
exports.updateTodo = updateTodo;
