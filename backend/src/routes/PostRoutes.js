import { createPost, getAllPosts, getPostById, screenResumes } from "../controllers/PostController.js";

export default async function postRoutes(fastify) {
  fastify.post("/posts", createPost);
  fastify.get("/posts", getAllPosts);
  fastify.get("/posts/:id", getPostById);
  fastify.post("/screen-resumes/:id", screenResumes);
}
