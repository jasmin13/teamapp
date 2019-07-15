var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var taskSchema = new Schema({
  task: { type: String, required: true },
  status: {
    type: String,
    enum: ["0", "1"],
    default: "0"
  },
  memberId: { type: String },
  sessionID: { type: String }
});

module.exports = mongoose.model("Task", taskSchema);
