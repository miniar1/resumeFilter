import mongoose from "mongoose";

const DeliverableSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  intern: { type: String, ref: "Intern", required: true },
  validated: { type: Boolean, default: false }
});

export const Deliverable = mongoose.model("Deliverable", DeliverableSchema);
