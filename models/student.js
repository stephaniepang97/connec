var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var studentSchema = new Schema({
  firstName: String,
  lastName: String,
  studentId: String,
  number: String,
  companies: [String]
});

var Student = mongoose.model('Student', studentSchema);

module.exports = Student;