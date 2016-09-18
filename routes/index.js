var express = require('express');
var router = express.Router();
var Company = require('../models/company');
var Student = require('../models/student');
var twilio = require('twilio');

var TWILIO_ACCOUNT_SID='ACa64f11740b61def66df7e60ed26a30e1';
var TWILIO_AUTH_TOKEN='778c742e8e2e5be0ba8d29f66f929157';
var client = twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');

var careerFairStart = new Date('2016-09-17 12:00:00');
var careerFairEnd   = new Date('2016-09-17 18:00:00');

/* GET home page (recruiter and student buttons). */
router.get('/', function(req, res, next) {
 	res.render('index', {title: 'Career Fair'})
});

/*****************
 *** EMPLOYERS ***
 *****************/

/* After employers login, 
 * go to setup page if company not in database
 * else go to home page
 */
router.post('/employers', function(req, res, next){
	Company.find({companyId: req.body.id}, function(err, docs){
		req.session.companyId = req.body.id;
		if (docs.length>0){
			console.log("ADDING COMPANY: \n" + docs)
			res.redirect('/employerHome');
		}
		else{
			res.redirect('/employerSetup')
		}
	});
});

/* GET employer set up page. */
router.get('/employerSetup', function(req, res, next) {
 	res.render('employerSetup')
});

/* POST employer info. */
/* After employers submit their form */
router.post('/submitCompany', function(req, res, next) {
	// TODO
	Company.create({companyId: req.session.companyId, companyName:req.body.name, 
					industry: req.body.industry, companyInfo:req.body.info,
					jobs:req.body.jobs, queue:['spang','ksitu']}, 
		function(err, obj) {
		if (err) {
			console.log("Error creating company");
		}
		console.log(obj);
	});
	res.redirect('/employerHome');
});

/* GET employer home page. */
router.get('/employerHome', function(req, res, next) {
	Company.findOne({companyId: req.session.companyId}, function(err, company) {
		if (company.queue.length <= 0) {
			res.render('employerHome', {companyName: company.companyName, 
							nextStudent: "---", numLeft: company.queue.length});
		}
		else {
			Student.findOne({studentId: company.queue[0]}, function(err, student){
				console.log(student);
				res.render('employerHome', {companyName: company.companyName, 
					nextStudent: student.firstName + " " + student.lastName, numLeft: company.queue.length});		
			});
		}

	});
});

/* After the employer clicks Next Student */
router.put('/nextStudent', function(req, res, next) {
	Company.findOne({companyId: req.session.companyId}, function(err, company) {
 		if (company.queue.length > 0) {
 			
 			// remove student from company's queue
 			var finishedStudent = company.queue.shift();
  			company.save();

 			// remove company from student's list of companies
 			Student.findOne({studentId: finishedStudent}, function(err, student){
 				var index = student.companies.indexOf(company.companyId);
 				if (index > -1) {
 					student.companies.splice(index, 1);
  					student.save();
 					console.log("Removed company from student's list. " + student.companies)
 				}
 				else {
 					console.log("Error. Couldn't find company " + company.companyId 
 								+ " in student " + student.studentId + "'s list.");
 				}
 			});

 			if (err) { console.log (err); }

 			console.log(company.queue);
 			// text next student
 			if (company.queue.length >= 1) { 
 				var firstStudent = company.queue[0];
 				Student.findOne({studentId:firstStudent}, function(err, student) {
	 				client.sendMessage({
	 					to: student.number.toString(),
	 					from: '6465534040',
	 					body: 'You\'re up NOW for ' + company.companyName + '! Please\
	 						   make your way to the booth now or you will be skipped.'
	 				});
	 			});
 			}

 			// text next next student
 			if (company.queue.length >= 2) {
 				var secondStudent = company.queue[1];

	 			Student.findOne({studentId:secondStudent}, function(err, student) {
	 				client.sendMessage({
	 					to: student.number.toString(),
	 					from: '6465534040',
	 					body: 'There is only one person ahead of you in line for ' +
	 						   company.companyName + '! Start making your way to the\
	 						   booth now.'
	 				});
	 			});
 			}

 		}
 	});
	res.send({});
});


/****************
 *** STUDENTS ***
 ****************/

/* After students log in, 
 * if current time < career fair start or > career fair end, 
 * redirect to countdown page
 * else 
 * redirect to my queues
 */
 router.post('/students', function(req, res, next){

 	req.session.studentId = req.body.id;
 	
 	Student.find({studentId: req.body.id}, function(err, docs){
		if (docs.length>0){
			console.log(docs);
			console.log(req.body);
			console.log("req session " + req.session.studentId);
			res.redirect('/studentHome');
		}
		else {
			res.redirect('/studentSetup');
		}
	});

 });


/* GET student setup page. */
router.get('/studentSetup', function(req, res, next) {
 	res.render('studentSetup')
});


/* POST student info. */
/* After students submit their form */
router.post('/submitStudent', function(req, res, next) {
	// TODO
	Student.create({studentId: req.session.studentId, firstName:req.body.firstName, lastName:req.body.lastName,
					number: req.body.number, companies:[]}, 
		function(err, obj) {
		if (err) {
			console.log("Error creating student");
		}
		console.log(obj);
	});

 	res.redirect('/studentHome');
});

/* GET countdown page. */
router.get('/countdown', function(req, res, next) {
 	res.render('countdown')
});

/* GET student home page. */
router.get('/studentHome', function(req, res, next) {
 	Student.findOne({studentId: req.session.studentId}, function(err, student) {
 		res.render('studentHome', { companies: student.companies, studentId: student.studentId});
 	});
});

/* GET all companies page */
router.get('/allCompanies', function(req, res, next) {
	Company.find({}, function(err, companies){
		if (err) {
			console.log(err);
		}
		res.render('allCompanies', { companies: companies});
	});
});

/* add company to student's list of companies */
router.put('/addCompany', function(req, res, next) {
	Student.findOne({studentId: req.session.studentId}, function(err, student) {
 		if (student.companies.length < 5) {
 			student.companies.push(req.body.id);
 			Company.findOne({companyId: req.body.id}, function(err, company) {
 				company.queue.push(student.studentId);
 			});
 		}
 		else {
 			alert("Sorry. You cannot line up for more than 5 companies at once!\
 				   Go back to remove companies from your list. Choose wisely!");
 		}
 	});
});

/* see company description */
router.get('/companyDesc/:id', function(req, res, next) {
	Company.findOne({companyId: req.params.id}, function(err, company){
		res.render('companyDesc', { company: company});
	});
});

module.exports = router;