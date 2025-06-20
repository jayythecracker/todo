import { Router } from "express";
import { createTdo, deleteTodo, getAll, getTodo, updateTodo } from "../controllers/todo";

const router =Router()

router.post('/create',createTdo)
router.get('/',getAll)
router.delete('/:id',deleteTodo)
router.get('/:id',getTodo)
router.patch('/',updateTodo)
export default router