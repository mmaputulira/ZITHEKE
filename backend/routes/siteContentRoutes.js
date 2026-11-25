import express from "express";
import { getPublicFooter } from "../Controllers/siteContentController.js";

const router = express.Router();
router.get("/footer", getPublicFooter);
export default router;
