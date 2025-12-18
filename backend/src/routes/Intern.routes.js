import {
  addIntern,
  getInterns,
  getInternById,
  updateIntern,
  deleteIntern,
} from "../controllers/Intern.controller.js";
import multer from 'fastify-multer';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/interns');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

export default async function internRoutes(fastify, options) {
  fastify.post(
    '/addInterns',
    { preHandler: upload.fields([
      { name: 'profilePic', maxCount: 1 },
      { name: 'cvUrl', maxCount: 1 },
      { name: 'deliverable', maxCount: 1 },
    ]) },
    addIntern
  );
  fastify.get("/interns", getInterns);
  fastify.get("/interns/:id", getInternById);
  fastify.put("/interns/:id", updateIntern);
  fastify.delete("/interns/:id", deleteIntern);
}
