import { Router } from "express";
import upload from "../utils/multer";
import { signup } from "../controllers/signup";
import { login } from "../controllers/login";
import { allUsers, me } from "../controllers/user";
import { refreshToken, logout } from "../controllers/refresh";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.post("/signup", upload.single("profile_photo"), signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/users", authenticate, authorize, allUsers);
router.post("/me", authenticate, me);
export default router;
