import { populate } from "dotenv";
import { Internship } from "../models/InternshipModel.js";
import path from "path";
import { error } from "console";
// controllers/internship.controller.js
import fs from "fs";

export const createInternship = async (request, reply) => {
  try {
    const data = request.body; // grâce à attachFieldsToBody: true

    // 🔹 Gérer fichier uploadé
    let filePath = null;
    if (data.descriptionFile) {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

      const fileName = `${Date.now()}-${data.descriptionFile.filename}`;
      filePath = path.join(uploadDir, fileName);

      await fs.promises.writeFile(filePath, await data.descriptionFile.toBuffer());
      filePath = `/uploads/${fileName}`; // chemin relatif à servir plus tard
    }

    // 🔹 Parser tasks (envoyé comme JSON string depuis le front)
    const tasks = data.tasks ? JSON.parse(data.tasks) : [];

    const internship = await Internship.create({
      title: data.title,
      deadline: data.deadline,
      type: data.type || "Summer", 
      tasks,
      assignedTo: data.assignedTo || null,
      recommendation: data.recommendation || "",
      progress: data.progress || "Pending",
      descriptionFile: filePath,
    });

    reply.code(201).send({
      message: "Internship added successfully",
      internship,
    });
  } catch (err) {
    console.error("❌ Error in createInternship:", err);
    reply.code(500).send({
      error: err.message,
      details: err.stack,
    });
  }
};





export const getInternshipById = async (request, reply) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return reply.code(404).send({ message: "Intern not found" });
    reply.send(internship);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};
export const getInternship = async (req, reply) => { 
  try {
    const internships = await Internship.find()
      .populate({
        path: "assignedTo",   
        select: "fullName email" 
      })
      .sort({ deadline: 1 });

    reply.send(internships);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};
export const getInternshipDL = async (req, reply) => {
  try {
    // Récupérer toutes les internships
    const internships = await Internship.find()
      .populate({
        path: "assignedTo",
        select: "fullName email"
      })
      .sort({ deadline: 1 });

    // Définir le début et fin de la journée actuelle (en UTC pour correspondre au format ISO)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Filtrer les internships qui expirent aujourd'hui
const todayDeadlines = internships.filter(internship => {
  const deadline = new Date(internship.deadline); // ✅ cast en Date
  return deadline >= todayStart && deadline <= todayEnd;
});


    // Réponse structurée
    reply.send({
      all: internships,
      today: todayDeadlines
    });
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};



export const updateInternship = async (req,reply) => {
    try {
     const internship = await Internship.findByIdAndUpdate(req.params.id, req.body, {new: true});
     if (!internship) return reply.code(404).send({ message: "Internship not found" });
     reply.send({ message: "Intern upDated successfully" });
    }catch(err){
        reply.code(500).send({error: err.message});
    }
};
export const deleteInternship = async (req,reply) => {
    try {
        const internship = await Internship.findByIdAndDelete(req.params.id);
        reply.send({message:"Internship deleted successfully" });
    }catch(err){
        reply.code(500).send({error: err.message});
    }
};



export const getTodayTasks = async (req, reply) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // On récupère tous les internships avec leurs tasks
    const internships = await Internship.find()
      .populate({
        path: "assignedTo",
        select: "fullName email"
      });

    // Filtrer seulement les tasks dont la deadline est aujourd'hui
    const todayTasks = [];

    internships.forEach((internship) => {
      const tasksToday = internship.tasks.filter((task) => 
        task.deadline >= startOfDay && task.deadline <= endOfDay
      );

      if (tasksToday.length > 0) {
        todayTasks.push({
          internshipId: internship._id,
          internshipTitle: internship.title,
          assignedTo: internship.assignedTo,
          tasks: tasksToday
        });
      }
    });

    reply.send(todayTasks);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};

