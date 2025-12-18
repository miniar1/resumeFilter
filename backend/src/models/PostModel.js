import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    Degree: { type: String },
    Major: { type: String },
    Skills: { type: [String], default: [] },
    SoftSkills: { type: [String], default: [] },
    Exp_Year: { type: Number, default: 0 },   
    extractedText: { type: String },
    info: { 
      type: Object,
      default: {}
    }, // Résultats du screening, métadonnées, etc.
  },
  { timestamps: true }
);

// Index pour améliorer les performances de recherche
PostSchema.index({ jobTitle: 1 });
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model("Post", PostSchema);