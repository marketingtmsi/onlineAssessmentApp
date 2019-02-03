var express = require('express');
var router = express.Router();

var auth = require('./authenticator');

var Page = require('../models/pages');
var Question = require('../models/questions');
var Answer = require('../models/answers');

/* GET list of question papers to attempt */
router.get('/', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  console.log('session id ' + req.sessionID);
  console.log('session maxAge ' + req.session.cookie.expires + ' ' + req.session.cookie.maxAge);
  Question.find({}, '-pages', function (err, questionsResult) {
    if (questionsResult.length > 0) {
      res.render('questions', { username: req.session.user, questionslist: questionsResult });
    } else {
      res.render('questions', { username: req.session.user });
    }
  });
});

/* GET calculate and redirect to the active question page for answering */
router.get('/:id([A-Za-z0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var id = req.params.id;
  Answer.findOne({ username: req.session.user, qid: id, status: 'attempting' }, 'pages', function (err, answersResult) {
    if (answersResult) {
      var curr_page_num = answersResult.pages.length;
      next_page_num = curr_page_num + 1;
      res.redirect('/questions/' + id + '/pages/' + next_page_num);
    } else {
      res.redirect('/questions/' + id + '/pages/1');
    }
  });
});

/* GET display active question page for answering */
router.get('/:id([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var id = req.params.id;
  var curr_page_num = parseInt(req.params.pno);
  var image_prev_question = '';
  var image_prev_answer = '';

  Answer.findOne({ username: req.session.user, qid: id, status: 'attempting' }, 'pages', function (err, answersResult) {
    if (answersResult && curr_page_num <= answersResult.pages.length) {
      res.redirect('/questions/' + id);
    } else {
      if (curr_page_num > 1) {
        var message_str = 'Your answer to page ' + (curr_page_num - 1) + ' has been saved.';
        Question.findById(id, 'pages', function (err, questionsResult) {
          var prev_page_id = questionsResult.pages[curr_page_num - 2];
          var curr_page_id = questionsResult.pages[curr_page_num - 1];
          Page.findById(prev_page_id, function (err, pagesResult) {
            image_prev_question = pagesResult.image
            console.log('image_prev_question ' + image_prev_question.substr(0, 10));
            Answer.findOne({ username: req.session.user, qid: id, status: 'attempting' }, { pages: { $slice: [curr_page_num - 2, 1] } }, function (err, answersResult) {
              image_prev_answer = answersResult.pages[0];
              console.log('image_prev_answer ' + image_prev_answer.substr(0, 10));
              Page.findById(curr_page_id, function (err, pagesResult) {
                try {
                  res.render('question', { username: req.session.user, message: message_str, page: curr_page_num, total_pages: questionsResult.pages.length, img_src: pagesResult.image, img_src_prev_qn: image_prev_question, img_src_prev_ans: image_prev_answer, form_action: '/questions/' + id + '/pages/' + curr_page_num });
                } catch (e) {
                  res.render('question', { username: req.session.user, message: 'error', error: true });
                }
              });
            });
          });
        });
      } else {
        Question.findById(id, 'pages', function (err, questionsResult) {
          var page_id = questionsResult.pages[curr_page_num - 1];
          Page.findById(page_id, function (err, pagesResult) {
            try {
              res.render('question', { username: req.session.user, page: curr_page_num, total_pages: questionsResult.pages.length, img_src: pagesResult.image, form_action: '/questions/' + id + '/pages/' + curr_page_num });
            } catch (e) {
              res.render('question', { username: req.session.user, message: 'error', error: true });
            }
          });
        });
      }
    }
  });
});

/* POST save answer to a specific question page */
router.post('/:id([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var id = req.params.id;
  var curr_page_num = parseInt(req.params.pno);
  var next_page_num = curr_page_num + 1;

  var total_pages = req.body['total_pages'];
  var image_data = req.body['canvas_answer'];
  console.log('no of bytes in answer ' + Buffer.byteLength(image_data, 'base64'));

  if (curr_page_num == 1) {
    Answer.find({ username: req.session.user, qid: id }, 'attempt', function (err, answersResult) {
      var attempt_num = answersResult.length;
      var answers_instance = new Answer({ username: req.session.user, attempt: (attempt_num + 1), qid: id, pages: [image_data], marks: 0, status: 'attempting' });
      answers_instance.save(function (err) { 
        if (err) throw err; 
      });
    })
  } else {
    if (next_page_num <= total_pages) {
      Answer.updateOne({ username: req.session.user, status: 'attempting', qid: id }, { $push: { pages: image_data } }, function (err, answersResult) {
        if (err) throw err;
      });
    } else {
      Answer.updateOne({ username: req.session.user, status: 'attempting', qid: id }, { status: "marking", $push: { pages: image_data } }, function (err, answersResult) {
        if (err) throw err;
      });
    }
  }

  if (next_page_num <= total_pages) {
    res.redirect('/questions/' + id + '/pages/' + next_page_num);
  } else {
    res.redirect('/questions');
  }
});

module.exports = router;