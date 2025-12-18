import {analyzeResume} from "../controllers/resumeController.js";

export default async function (fastify) {
  fastify.post("/api/resume", analyzeResume);
}
