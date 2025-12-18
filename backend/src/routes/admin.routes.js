import { verifyJWT } from "../plugins/authPlugin.js";
import {getAdmin, registerAdmin} from "../controllers/Admin.controller.js";
import fastifyRateLimit from '@fastify/rate-limit';
export default async function adminRoutes(fastify, options) {
    
    fastify.register(fastifyRateLimit, {
        global: false,
        max: 5,
        timeWindow: '1 minute'
    });

    fastify.post("/login", {
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '1 minute'
            } } }, getAdmin);
    fastify.post("/register", registerAdmin);
    fastify.get("/Internconnect", { preValidation: [verifyJWT] }, async (request, reply) => {
    reply.send({ data: "Données secrètes", user: request.user });
  });
};