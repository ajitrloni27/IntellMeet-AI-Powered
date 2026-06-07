const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  column: { 
    type: String, 
    enum: ["TODO", "IN_PROGRESS", "DONE"], 
    default: "TODO" 
  },
  owner: { type: String, default: "Unassigned" },
  priority: { 
    type: String, 
    enum: ["High", "Medium", "Low"], 
    default: "Medium" 
  },
  dueDate: { type: String, default: "" },
  workspaceId: { type: String, default: "default" }
}, {
  timestamps: true
});

module.exports = mongoose.model("Task", taskSchema);
