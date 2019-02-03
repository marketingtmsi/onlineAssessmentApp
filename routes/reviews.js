var express = require('express');
var router = express.Router();

var auth = require('./authenticator');

var Page = require('../models/pages');
var Question = require('../models/questions');
var Answer = require('../models/answers');
var Marking = require('../models/markings');
var Correction = require('../models/corrections');
var Review = require('../models/reviews');

/* GET view a specific review page */
router.get('/:id([A-Za-z0-9]+)/corrections/:cid([A-Za-z0-9]+)/markings/:mid([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)/view', auth.checkSignIn, function (req, res, next) {
  var id = req.params.id;
  var cid = req.params.cid;
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
  var image_review = null;

  Review.findById(id, { pages: { $slice: [curr_page_num - 1, 1] } }, function(err, reviewsResult) {
  }).then(function(reviews) {
    console.log('reviews completed');
    image_review = reviews.pages[0];

    Correction.findById(cid, { pages: { $slice: [curr_page_num - 1, 1] } }, function(err, correctionsResult) {
    }).then(function(corrections) {
      console.log('corrections completed');
      image_correction = corrections.pages[0];

      Marking.findById(mid, { pages: { $slice: [curr_page_num - 1, 1] } }, function(err, markingsResult) {
      }).then(function(markings) {
        console.log('markings completed');
        image_marking = markings.pages[0];

        Answer.findById(req.params.aid, { marks: 1, pages: { $slice: [curr_page_num - 1, 1] } }, function (err, answersResult) {
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
              var partial_path = '/reviews/' + id + '/corrections/' + cid + '/markings/' + mid + '/answers/' + aid + '/questions/' + qid + '/pages/';

              if (curr_page_num == 1) {
                next_page = partial_path + next_page_num + '/view';
              } else if (curr_page_num < total_pages) {
                next_page = partial_path + next_page_num + '/view';
                previous_page = partial_path + prev_page_num + '/view';
              } else {
                previous_page = partial_path + prev_page_num + '/view';
              }

              res.render('review', {
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
                img_src_crx: image_correction,
                img_src_rv: image_review
              });
            });
          });
        });
      });
    });
  });    
});

module.exports = router;