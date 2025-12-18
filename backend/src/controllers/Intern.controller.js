import { Intern } from "../models/InternModel.js";
import fs from "fs";
import path from "path";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const uploadDir = path.join('uploads', 'interns');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const addIntern = async (request, reply) => {
  try {
    const {fullName, phone, email, password, university, level,major, datestart,
       dateEnd, departement, supervisor, note, internship } = request.body;
    const existingIntern = await Intern.findOne({ email });
    if(existingIntern){
      return reply.code(400).send({message:'Intern already exists'});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
   
    const newIntern = new Intern({
        fullName, phone, email, password: hashedPassword,
        university, level,major, datestart,
       dateEnd,departement, supervisor, note, internship
    });
    if (request.files) {
      if (request.files.profilePic){
        newIntern.profilePic = request.files.profilePic[0].path;
      }
        if (request.files.cvUrl){
        newIntern.cvUrl = request.files.cvUrl[0].path;
      }
        if (request.files.deliverable){
        newIntern.deliverable = request.files.deliverable[0].path;
       
      }
    }
    await newIntern.save();
    reply.code(201).send({message:'Intern added successfully', intern: newIntern});
  
  } catch (err) {
    console.error("Error creating intern",err);
    reply.code(500).send({ error:'Failed to create intern' });
  }
};

// READ ALL
export const getInterns = async (request, reply) => {
  try {
    const interns = await Intern.find().populate('supervisor').populate('internship');
    reply.send(interns);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};
// READ ONE
export const getInternById = async (request, reply) => {
  try {
    const intern = (await Intern.findById(request.params.id)).populate('supervisor').populate('internship');
    if (!intern){
       return reply.code(404).send({ message: "Intern not found" });
    }
    reply.send(intern);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};

// UPDATE
export const updateIntern = async (req, reply) => {
  try {
    const intern = await Intern.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!intern) return reply.code(404).send({ message: "Intern not found" });
    reply.send(intern);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};

// DELETE
export const deleteIntern = async (req, reply) => {
  try {
    const intern = await Intern.findByIdAndDelete(req.params.id);
    if (!intern) return reply.code(404).send({ message: "Intern not found" });
        [intern.profilePic, intern.cvUrl, intern.deliverable].forEach((filePath) => {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    reply.send({ message: "Intern deleted successfully" });
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};
