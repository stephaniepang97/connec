var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var companySchema = new Schema({
  companyId: String,
  companyName: String,
  industry: String,
  companyInfo: String,
  jobs: String,
  queue: [String]
});

var Company = mongoose.model('Company', companySchema);

module.exports = Company;