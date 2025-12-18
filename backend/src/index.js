import cors from '@fastify/cors';
import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyJWT from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from "@fastify/static";
import dotenv from 'dotenv';
import fs from 'fs';
import path from "path";
import mongoose from 'mongoose';

import adminRoutes from './routes/admin.routes.js'; 
import internRoutes from "./routes/Intern.routes.js"; 
import internshipRoutes from "./routes/internship.routes.js";
/*import resumeRoutes from "./routes/resume.routes.js";*/
import postRoutes from "./routes/PostRoutes.js";

// Load .env from current working directory first.
dotenv.config();
// If required vars are not present, try loading .env from the parent folder
// (covers the case where nodemon/node was started inside `src` instead of project root)
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  const parentEnv = path.resolve(process.cwd(), '..', '.env');
  if (fs.existsSync(parentEnv)) {
    dotenv.config({ path: parentEnv });
  }
}
// Fail fast with a helpful message when required env vars are missing
const requiredEnvs = ["JWT_SECRET", "MONGO_URI"];
const missingEnvs = requiredEnvs.filter((k) => !process.env[k]);
if (missingEnvs.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingEnvs.join(", ")}`
  );
  console.error("Create a .env file in the backend folder with these values, for example:\n\nJWT_SECRET=your_jwt_secret_here\nMONGO_URI=mongodb://user:pass@host:port/dbname\n\nThen restart the server.");
  process.exit(1);
}

const fastify = Fastify({ logger: true });

const start = async () => {
  try {
    // Plugins
    await fastify.register(cors, {
      origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://192.168.16.1:3000'
      ],
      credentials: true, 
    });

    await fastify.register(fastifyMultipart, {
      attachFieldsToBody: true,
      limits: { fileSize: 10 * 1024 * 1024 }
    });

    await fastify.register(fastifyStatic, {
      root: path.join(process.cwd(), "uploads"),
      prefix: "/uploads/",
    });

    fastify.register(fastifyJWT, {
      secret: process.env.JWT_SECRET,
    });

    fastify.register(fastifyRateLimit, {
      max: 100,
      timeWindow: '1 minute'
    });

    // Routes
    await fastify.register(adminRoutes, { prefix: "/api" });
    await fastify.register(internRoutes, { prefix: "/api" });
    await fastify.register(internshipRoutes, { prefix: "/api" });
    //await fastify.register(resumeRoutes, { prefix: "/api" } );
    await fastify.register(postRoutes, { prefix: "/api" }); // 👈 NOUVELLE ROUTE

    // Test route
    fastify.get('/', async () => {
      return { status: "API is running" };
    });

    // DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');

    // Start server
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    console.log('Serveur démarré sur le port', process.env.PORT || 3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
