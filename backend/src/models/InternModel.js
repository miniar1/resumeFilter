import mongoose from "mongoose";

const InternSchema = new mongoose.Schema(
  { 
    fullName: { type: String, required: true },
    phone: {type: String, required:true },
    email: { type: String, required: true, unique: true },
    password: {type: String, required: true},
    university: { type: String },
    level: { type: String },
    major: { type: String },
    datestart: { type: Date },
    dateEnd: { type: Date },
    departement: { type: String },
    supervisor: { type: mongoose.Schema.Types.ObjectId, required: true },
    note: [{type: String}],
    internship: [{ type: mongoose.Schema.Types.ObjectId, ref: "Internship" }],
    cvUrl: {type: String},
    profilePic: { type: String}, 
    deliverable: { type: String }
  },
  { timestamps: true }
);

export const Intern = mongoose.model("Intern", InternSchema);
