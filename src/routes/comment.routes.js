import { Router } from "express";

import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/commet.controller.js";
import { verifyJWT } from "../middlewares/auth.moddleware.js";


const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideoComments).post(addComment);

router.route("/c/:commentId").delete(deleteComment).patch(updateComment);


export default router;