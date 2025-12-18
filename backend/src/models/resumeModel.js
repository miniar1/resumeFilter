import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    email: { type: String },
    phone: { type: String },

    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },

    cosine_similarity_score: { type: Number, default: 0 },
    skills_score: { type: Number, default: 0 },
    education_score: { type: Number, default: 0 },
    exp_score: { type: Number, default: 0 },
    final_score: { type: Number, default: 0 },

    extractedText: { type: String },
    info: { type: Object }, // SKILLS, SoftSkills, Degree, Major, Exp_Year...
  },
  { timestamps: true }
);

export default mongoose.model("Resume", ResumeSchema);
