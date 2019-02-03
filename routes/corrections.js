var express = require('express');
var router = express.Router();

var auth = require('./authenticator');

var Page = require('../models/pages');
var Question = require('../models/questions');
var Answer = require('../models/answers');
var Marking = require('../models/markings');
var Correction = require('../models/corrections');
var Review = require('../models/reviews');

/* GET view a specific correction page */
router.get('/:id([A-Za-z0-9]+)/markings/:mid([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)/view', auth.checkSignIn, function (req, res, next) {
  var id = req.params.id;
  var mid = req.params.mid;
  var aid = req.params.aid;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var prev_page_num = curr_page_num - 1;
  var next_page_num = curr_page_num + 1;
  var image_question = null;
  var image_answer = null;
  var image_marking = null;
  var image_correction = null;

  Correction.findById(id, { pages: { $slice: [curr_page_num - 1, 1] } }, function(err, correctionsResult) {
  }).then(function(corrections) {
    console.log('corrections completed');
    image_correction = corrections.pages[0];

    Marking.findById(mid, { pages: { $slice: [curr_page_num - 1, 1] } }, function(err, markingsResult) {
    }).then(function(markings) {
      console.log('markings completed');
      image_marking = markings.pages[0];

      Answer.findById(aid, { marks: 1, pages: { $slice: [curr_page_num - 1, 1] } }, function (err, answersResult) {
      }).then(function(answers) {
        console.log('answers completed');
        image_answer = answers.pages[0];
          
        Question.findById(qid, 'total_marks pages', function (err, questionsResult) {
        }).then(function(questions) {
          console.log('questions completed');
          var page_id = questions.pages[curr_page_num - 1];
          var total_pages = questions.pages.length;
    
          Page.findById(page_id, 'image', function (err, pagesResult) {
          }).then(function(pages) {
            console.log('pages completed');
            image_question = pages.image;
            var next_page = '';
            var previous_page = '';
            var partial_path = '/corrections/' + id + '/markings/' + mid + '/answers/' + aid + '/questions/' + qid + '/pages/';

            if (curr_page_num == 1) {
              next_page = partial_path + next_page_num + '/view';
            } else if (curr_page_num < total_pages) {
              next_page = partial_path + next_page_num + '/view';
              previous_page = partial_path + prev_page_num + '/view';
            } else {
              previous_page = partial_path + prev_page_num + '/view';
            }

            res.render('correction', {
              username: req.session.user,
              role: req.session.role,
              back_link: '/answers/questions/' + qid,
              marks: answers.marks,
              total_marks: questions.total_marks,
              page: curr_page_num,
              total_pages: total_pages,
              previous_action: previous_page,
              next_action: next_page,
              img_src_qn: image_question,
              img_src_ans: image_answer,
              img_src_mark: image_marking,
              img_src_crx: image_correction
            });
          });
        });
      });
    });
  });
});

/* GET display active correction page for reviewing */
router.get('/:id([A-Za-z0-9]+)/markings/:mid([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  var id = req.params.id;
  var mid = req.params.mid;
  var aid = req.params.aid;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var image_question = null;
  var image_answer = null;
  var image_marking = null;
  var image_correction = null;

  Correction.findById(id, { pages: { $slice: [curr_page_num - 1, 1] } }, function(err, correctionsResult) {
  }).then(function(corrections) {
    console.log('corrections completed');
    image_correction = corrections.pages[0];

    Marking.findById(mid, { marks: 1, pages: { $slice: [curr_page_num - 1, 1] } }, function (err, markingsResult) {
    }).then(function(markings) {
      console.log('markings completed');
      image_marking = markings.pages[0];
          
      Answer.findById(aid, { pages: { $slice: [curr_page_num - 1, 1] } }, function (err, answersResult) {
      }).then(function(answers){
        console.log('answers completed');
        image_answer = answers.pages[0];
            
        Question.findById(qid, 'pages', function (err, questionsResult) {
        }).then(function(questions) {
          console.log('questions completed');
          var total_pages = questions.pages.length;
          var page_id = questions.pages[curr_page_num - 1];

          Page.findById(page_id, 'image', function (err, pagesResult) {
          }).then(function(pages) {
            console.log('pages completed');
            image_question = pages.image;

            res.render('student_correction', {
              username: req.session.user,
              page: curr_page_num,
              total_pages: total_pages,
              form_action: '/corrections/' + id + '/markings/' + mid + '/answers/' + aid + '/questions/' + qid + '/pages/' + curr_page_num,
              img_src_qn: image_question,
              img_src_ans: image_answer,
              img_src_mark: image_marking,
              img_src_crx: image_correction
            });
          });
        });
      });
    });
  });  
});

/* POST save review to a specific correction page */
router.post('/:id([A-Za-z0-9]+)/markings/:mid([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  var id = req.params.id;
  var mid = req.params.mid;
  var aid = req.params.aid;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var next_page_num = curr_page_num + 1;

  var total_pages = req.body['total_pages'];
  var image_data = req.body['canvas_reviewing'];
  if (curr_page_num == 1) {
    var reviews_instance = new Review({ cid: id, mid: mid, aid: aid, pages: [image_data] });
    reviews_instance.save(function (err) {
      if (err) throw err;
      console.log('push new review image');
      if (next_page_num <= total_pages) {
        res.redirect('/corrections/' + id + '/markings/' + mid + '/answers/' + aid + '/questions/' + qid + '/pages/' + next_page_num);
      } else {
        res.redirect('/answers');
      }
    });
  } else {
    Review.findOneAndUpdate({ cid: id }, { $push: { pages: image_data } }, function (err, reviewsResult) {
      if (err) throw err;
      console.log('push review image');
      if (next_page_num <= total_pages) {
        res.redirect('/corrections/' + id + '/markings/' + mid + '/answers/' + aid + '/questions/' + qid + '/pages/' + next_page_num);
      } else {
        Answer.findByIdAndUpdate(aid, { status: 'reviewed',}, function(err, answersResult) {
          if (err) throw err;
          res.redirect('/answers');
        });
      }
    });
  }
});

module.exports = router;