import { Admin} from "../models/adminModel.js";
import { hashPassword, comparePassword } from '../plugins/hash.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import CVScreeningService from "../services/CVScreeningService.js";

export const getAdmin = async (request, reply) => {
    const{ email, password} = request.body;
     if (!email || !password) {
        return reply.code(400).send({ error: "Email and password are required" });
    }
    try{
        const admin = await Admin.findOne({ email });
        if (!admin) {
      return reply.code(401).send({ error: "Invalid credentials" });
      console.log("email recu:", email);
    }
        const isPasswordValid = await comparePassword(password, admin.password);
        if (!isPasswordValid) {
        return reply.code(401).send({ error:"Invalid password" });
        console.log("password recu :", password);
    }
    const token = jwt.sign({ id:admin._id, email: admin.email}, 
    process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN});
    reply.send({message:"Login successfuly", token,  admin: {id: admin._id, email: admin.email }});
    }catch(err){
        reply.code(500).send({error: err.message});
    }
};

export const registerAdmin = async (request, reply) => {
    try {
        const { email, password } = request.body; // Destructure from request.body

        if (!email || !password) {
            return reply.code(400).send({ error: "Email and password are required" });
        }
        if (password.length < 8) {
            return reply.code(400).send({ error: "Password must be at least 8 characters" });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return reply.code(400).send({ error: "Admin already exists"});
        }

        const hashedPassword = await hashPassword(password); // ✅ Properly hash the password
        
        const newAdmin = await Admin.create({ 
            email, 
            password: hashedPassword // Store the hashed password
        });

        reply.code(201).send({
            message: "Admin registered successfully",
            admin: { email: newAdmin.email }
        });
    } catch (err) {
        reply.code(500).send({ error: err.message });
    }
};