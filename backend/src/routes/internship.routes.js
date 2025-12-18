import { 
    createInternship,
    getInternship,
     getInternshipById,
     updateInternship,
     deleteInternship,
     getTodayTasks,
     getInternshipDL

 } from "../controllers/InternshipController.js";
 export default async function internshipRoutes(app, options) {
  app.post("/addInternship", { preValidation: app.authenticate }, createInternship);
     app.get("/getInternship", getInternship);
     app.get("/internship/:id", getInternshipById);
     app.put("/internship/:id", updateInternship);
     app.delete("/internship/:id", deleteInternship);
     app.get("/getTasks",getTodayTasks);
     app.get("/getIshipDL", getInternshipDL);
 }
 