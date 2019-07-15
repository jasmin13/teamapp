var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var MemberSchema = new Schema({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  sessionID: { type: String }
});

module.exports = mongoose.model("Member", MemberSchema);
