import mongoose, { Schema } from "mongoose";
import { hashPassword, comparePassword } from '../plugins/hash.js';
const adminSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required:true, minlength: 8},
    createdAt:{
        type:Date,
        default:Date.now
    }
}); 

// adminModel.js
adminSchema.pre('save', async function(next) {
  console.log("Running pre-save hook for password");
  if (!this.isModified('password')) return next();
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (err) {
    console.error("Pre-save hook error:", err);
    next(err);
  }
});
export const Admin = mongoose.model("Admin", adminSchema);

