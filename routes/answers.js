var express = require('express');
var router = express.Router();

var auth = require('./authenticator');

var Page = require('../models/pages');
var Question = require('../models/questions');
var Answer = require('../models/answers');
var Marking = require('../models/markings');
var Correction = require('../models/corrections');
var Review = require('../models/reviews');

/* GET view a list of attempts for a specific question set (marking, correcting, reviewing, reviewed, completed) */
router.get('/questions/:qid([A-Za-z0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var qid = req.params.qid
  Answer.find({ username: req.session.user, qid: qid, status: { $ne: 'attempting' } }, '-pages', { sort: { attempt: 1 } }, function (err, answersResult) {
    Question.findById(qid, 'name total_marks', function (err, questionsResult) {
      if (err) throw err;
      res.render('answers', { username: req.session.user, name: questionsResult.name, answerslist: answersResult, total_marks: questionsResult.total_marks });
    });
  });
});

/* GET redirect to appropriate routers to display answers, markings, corrections, and reviews */
router.get('/:id([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/view', auth.checkSignIn, function (req, res, next) {
  var id = req.params.id;
  var qid = req.params.qid;
  Review.findOne({ aid: id }, '_id cid mid aid', function (err, reviewsResult) {
    if (reviewsResult) {
      res.redirect('/reviews/' + reviewsResult._id + '/corrections/' + reviewsResult.cid + '/markings/' + reviewsResult.mid + '/answers/' + reviewsResult.aid + '/questions/' + qid + '/pages/1/view');
    } else {
      Correction.findOne({ aid: id }, '_id mid aid', function (err, correctionsResult) {
        if (correctionsResult) {
          res.redirect('/corrections/' + correctionsResult._id + '/markings/' + correctionsResult.mid + '/answers/' + correctionsResult.aid + '/questions/' + qid + '/pages/1/view');
        } else {
          Marking.findOne({ aid: id }, '_id aid', function (err, markingsResult) {
            if (markingsResult) {
              res.redirect('/markings/' + markingsResult._id + '/answers/' + markingsResult.aid + '/questions/' + qid + '/pages/1/view');
            } else {
              res.redirect('/answers/' + id + '/questions/' + qid + '/pages/1/view');  
            }
          });
        }
      });
    }
  });
});

/* GET view a specific answer page */
router.get('/:id([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)/view', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var id = req.params.id;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var next_page_num = curr_page_num + 1;
  var prev_page_num = curr_page_num - 1;
  var image_question = null;
  var image_answer = null;

  Answer.findById(id, { pages: { $slice: [curr_page_num - 1, 1] } }, function (err, answersResult) {
  }).then(function(answers) {
    console.log('answers completed');
    image_answer = answers.pages[0];

    Question.findById(qid, 'pages', function (err, questionsResult) {
    }).then(function (questions) {
      console.log('questions completed');
      var total_pages = questions.pages.length;
      var page_id = questions.pages[curr_page_num - 1];

      Page.findById(page_id, 'image', function (err, pagesResult) {
        console.log('pagesResult ' + pagesResult._id);
      }).then(function (pages) {
        console.log('pages completed');
        image_question = pages.image;
        var next_path = '';
        var previous_path = '';
        var partial_path = '/answers/' + id + '/questions/' + qid + '/pages/';
  
        if (curr_page_num == 1) {
          next_path = partial_path + next_page_num + '/view';
        } else if (curr_page_num < total_pages) {
          next_path = partial_path + next_page_num + '/view';
          previous_path = partial_path + prev_page_num + '/view';
        } else {
          previous_path = partial_path + prev_page_num + '/view';
        }
  
        res.render('answer', {
          username: req.session.user,
          back_link: '/answers/questions/' + qid,
          page: curr_page_num,
          total_pages: total_pages,
          next_action: next_path,
          previous_action: previous_path,
          img_src_qn: image_question,
          img_src_ans: image_answer,
        });
      });
    });
  });
});

/* GET list of answers to be marked by teachers */
router.get('/', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  Answer
    .find({ $or: [{ status: 'marking' }, { status: 'reviewing' }] })
    .populate('qid', 'name')
    .select('-pages')
    .exec(function (err, answersResult) {
      console.log('student submissions ' + answersResult);
      res.render('student_submissions', { username: req.session.user, submissionslist: answersResult });
    });
});

/* GET calculate and redirect to the active answer page for marking or active correction page for reviewing */
router.get('/:id([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/:status', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  var id = req.params.id;
  var qid = req.params.qid;
  var status = req.params.status;
  var next_page_num = 1;

  if (status == 'marking') {
    Marking.findOne({ aid: id }, 'pages', function (err, markingsResult) {
      if (markingsResult != null) {
        var curr_page_num = markingsResult.pages.length;
        next_page_num = curr_page_num + 1;   
      }
      res.redirect('/answers/'+ id + '/questions/' + qid + '/pages/' + next_page_num);
    });
  }
  if (status == 'reviewing') {
    Review.findOne({ aid: id }, 'pages', function (err, reviewsResult) {
      if (reviewsResult != null) {
        var curr_page_num = reviewsResult.pages.length;
        next_page_num = curr_page_num + 1;  
      }
      Correction.findOne({ aid: id }, '_id mid', function (err, correctionsResult) {
        res.redirect('/corrections/' + correctionsResult._id + '/markings/' + correctionsResult.mid + '/answers/'+ id + '/questions/' + qid + '/pages/' + next_page_num);
      });
    });
  }
});

/* GET display active answer page for marking */
router.get('/:id([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  var id = req.params.id;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var image_question = null;
  var image_answer = null;
  Answer.findById(id, { marks: 1, pages: { $slice: [curr_page_num - 1, 1] } }, function (err, answersResult) {
    image_answer = answersResult.pages[0];
    Question.findById(qid, '-thumbnail', function (err, questionsResult) {
      var page_id = questionsResult.pages[curr_page_num - 1]
      Page.findById(page_id, 'image', function (err, pagesResult) {
        image_question = pagesResult.image;
        res.render('student_answer', {
          username: req.session.user,
          page: curr_page_num,
          form_action: '/answers/' + id + '/questions/' + qid + '/pages/' + curr_page_num,
          total_pages: questionsResult.pages.length,
          total_marks: questionsResult.total_marks,
          accumulated_marks: answersResult.marks,
          img_src_qn: image_question,
          img_src_ans: image_answer
        });
      });
    });
  });
});

/* POST save marking to a specific answer page */
router.post('/:id([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  var id = req.params.id;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var next_page_num = curr_page_num + 1;

  var image_data = req.body['canvas_marking'];
  var interim_marks = req.body['interim_marks'];
  var accumulated_marks = req.body['accumulated_marks'];
  var total_marks = req.body['total_marks'];
  var total_pages = req.body['total_pages'];
  var total_accumulated_marks = Number(interim_marks) + Number(accumulated_marks);
  
  if (curr_page_num == 1) {
    var markings_instance = new Marking({ aid: id, pages: [image_data] });
    markings_instance.save(function (err) {
      if (err) throw err;
    });
  } else {
    Marking.findOneAndUpdate({ aid: id }, { $push: { pages: image_data } }, function (err, markingsResult) {
      if (err) throw err;   
    });
  }    
  
  if (next_page_num <= total_pages) {
    Answer.findByIdAndUpdate(id, { marks: total_accumulated_marks }, function(err, answersResult) {
      if (err) throw err;
    }).then(function(answers) {
      res.redirect('/answers/' + id + '/questions/' + qid + '/pages/' + next_page_num);
    });
  } else {
    if (total_accumulated_marks < total_marks) {
      Answer.findByIdAndUpdate(id, { status: 'correcting', marks: total_accumulated_marks }, function(err, answersResult) {
        if (err) throw err;
      }).then(function(answers) {
        res.redirect('/answers');
      });
    } else {
      Answer.findByIdAndUpdate(id, { status: 'completed', marks: total_accumulated_marks }, function(err, answersResult) {
        if (err) throw err;
      }).then(function(answers) {
        res.redirect('/answers');
      });
    }
  }
});

module.exports = router;