// models/InternshipModel.js
import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema({
  title: {type: String, required: true, trim: true},
  deadline: { type: Date,required: true},
  tasks: [{label: String,
          deadline: Date,
  completed: { type: Boolean, default: false }}],
  type: {type:String,required:true, trim:true},
  assignedTo: { type: mongoose.Schema.Types.ObjectId,
    ref: 'Intern', 
    required: false  },
  recommendation: {type: String,default: ''},
  progress: {type: String,enum: ['Pending', 'In Progress', 'Completed', 'Rejected'], 
    default: 'Pending'
  },
  descriptionFile: { type: String, required: false}
}, {
  timestamps: true
});

export const Internship = mongoose.model('Internship', internshipSchema);