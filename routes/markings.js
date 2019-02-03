var express = require('express');
var router = express.Router();

var auth = require('./authenticator');

var Page = require('../models/pages');
var Question = require('../models/questions');
var Answer = require('../models/answers');
var Marking = require('../models/markings');
var Correction = require('../models/corrections');

/* GET list all markings done by teachers (correcting, reviewed, completed) */
router.get('/', [auth.checkSignIn, auth.checkTeacherRole], function (req, res, next) {
  Answer.find({ '$or': [{ status: 'correcting' }, { status: 'reviewed' }, { status: 'completed' }] })
    .populate('qid', 'name total_marks')
    .select('-pages')
    .exec(function (err, answersResult) {
      res.render('markings', { username: req.session.user, answerslist: answersResult });
  });
});

/* GET redirect to the active marking page for correcting */
router.get('/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var aid = req.params.aid;
  var qid = req.params.qid;
  Marking.findOne({ aid: aid }, '_id', function (err, markingsResult) {
  }).then(function(markings) {
    Correction.findOne({ aid: aid }, 'pages', function (err, correctionsResult) {
      if (correctionsResult) {
        var curr_page_num = correctionsResult.pages.length;
        next_page_num = curr_page_num + 1;
        res.redirect('/markings/' + markings._id + '/answers/' + aid + '/questions/' + qid + '/pages/' + next_page_num);
      } else {
        res.redirect('/markings/' + markings._id + '/answers/' + aid + '/questions/' + qid + '/pages/1');
      }
    });
  });
});

/* GET view a specific marking page */
router.get('/:id([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)/view', auth.checkSignIn, function (req, res, next) {
  var id = req.params.id;
  var aid = req.params.aid;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var next_page_num = curr_page_num + 1;
  var prev_page_num = curr_page_num - 1;
  var image_question = null;
  var image_answer = null;
  var image_marking = null;

  Marking.findById(id, { pages: { $slice: [curr_page_num - 1, 1] } }, function (err, markingsResult) {
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
        }).then(function (pages) {
          console.log('pages completed');
          image_question = pages.image;
          var next_path = null;
          var previous_path = null;
          var partial_path = '/markings/' + id + '/answers/' + aid + '/questions/' + qid + '/pages/';
            
          if (curr_page_num == 1) {
            next_path = partial_path + next_page_num + '/view';
          } else if (curr_page_num < total_pages) {
            next_path = partial_path + next_page_num + '/view';
            previous_path = partial_path + prev_page_num + '/view';
          } else {
            previous_path = partial_path + prev_page_num + '/view';
          }

          res.render('marking', {
            username: req.session.user,
            role: req.session.role,
            back_link: '/answers/questions/' + qid,
            marks: answers.marks,
            total_marks: questions.total_marks,
            page: curr_page_num,
            total_pages: total_pages,
            previous_action: previous_path,
            next_action: next_path,
            img_src_qn: image_question,
            img_src_ans: image_answer,
            img_src_mark: image_marking
          });
        });
      })
    });
  });
});

/* GET display active marking page for correcting */
router.get('/:id([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var id = req.params.id;
  var aid = req.params.aid;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var page_offset = 1;
  var image_curr_question = null;
  var image_prev_question = null;
  var image_curr_answer = null;
  var image_prev_answer = null;
  var image_curr_marking = null;
  var image_prev_marking = null;
  var image_prev_correction = null;

  if (curr_page_num > 1) {
    page_offset = 2;
  }

  Correction.findOne({ mid: id }, 'pages', function (err, correctionsResult) {
    if (correctionsResult && curr_page_num <= correctionsResult.pages.length) {
      res.redirect('/markings/' + id + '/answers/' + aid + '/questions/' + qid);
    } else {
      Marking.findById(id, { marks: 1, pages: { $slice: [curr_page_num - page_offset, page_offset] } }, function (err, markingsResult) {
      }).then(function(markings) {
        console.log('markings completed');
        if (page_offset > 1) {
          image_prev_marking = markings.pages[0];
          image_curr_marking = markings.pages[1];
        } else {
          image_curr_marking = markings.pages[0];
        }
        
        Answer.findById(aid, { pages: { $slice: [curr_page_num - page_offset, page_offset] } }, function (err, answersResult) {
        }).then(function(answers){
          console.log('answers completed');
          if (page_offset > 1) {
            image_prev_answer = answers.pages[0];
            image_curr_answer = answers.pages[1];
          } else {
            image_curr_answer = answers.pages[0];
          }
          
          Question.findById(qid, 'pages', function (err, questionsResult) {
          }).then(function(questions) {
            console.log('questions completed');
            var total_pages = questions.pages.length;
            var curr_page_id = questions.pages[curr_page_num - 1];
            var prev_page_id = null;
            if (page_offset > 1) {
              prev_page_id = questions.pages[curr_page_num - 2];
            }
    
            Page.findById(curr_page_id, 'image', function (err, pagesResult) {
            }).then(function(pages) {
              console.log('pages completed');
              image_curr_question = pages.image
    
              if (page_offset > 1) {
                Page.findById(prev_page_id, 'image', function (err, pagesResult) {
                }).then(function(pages) {
                  console.log('pages completed');
                  image_prev_question = pages.image

                  Correction.findOne({ mid: id }, { pages: { $slice: [curr_page_num - page_offset, 1] } }, function (err, correctionsResult) {
                  }).then(function(corrections) {
                    console.log('corrections completed');
                    image_prev_correction = corrections.pages[0];

                    res.render('teacher_marking', {
                      username: req.session.user,
                      back_link: '/answers/questions/' + qid,
                      page: curr_page_num,
                      total_pages: total_pages,
                      img_src_qn: image_curr_question,
                      img_src_ans: image_curr_answer,
                      img_src_mark: image_curr_marking,
                      img_src_prev_qn: image_prev_question, 
                      img_src_prev_ans: image_prev_answer,
                      img_src_prev_mark: image_prev_marking,
                      img_src_prev_correction: image_prev_correction
                    });
                  })
                });
              } else {
                res.render('teacher_marking', {
                  username: req.session.user,
                  back_link: '/answers/questions/' + qid,
                  page: curr_page_num,
                  total_pages: total_pages,
                  img_src_qn: image_curr_question,
                  img_src_ans: image_curr_answer,
                  img_src_mark: image_curr_marking
                });
              }  
            });
          });
        });
      });
    }
  });
});

/* POST save correction to a specific answer page */
router.post('/:id([A-Za-z0-9]+)/answers/:aid([A-Za-z0-9]+)/questions/:qid([A-Za-z0-9]+)/pages/:pno([0-9]+)', [auth.checkSignIn, auth.checkStudentRole], function (req, res, next) {
  var id = req.params.id;
  var aid = req.params.aid;
  var qid = req.params.qid;
  var curr_page_num = parseInt(req.params.pno);
  var next_page_num = curr_page_num + 1;
  
  var total_pages = req.body['total_pages'];
  var image_data = req.body['canvas_correcting'];

  if (curr_page_num == 1) {
    var corrections_instance = new Correction({ mid: id, aid: aid, pages: [image_data] });
    corrections_instance.save(function (err) {
      if (err) throw err;
    }).then(function(corrections) {
      if (next_page_num <= total_pages) {
        res.redirect('/markings/' + id + '/answers/' + aid + '/questions/' + qid + '/pages/' + next_page_num);
      } else {
        res.redirect('/answers/questions/' + qid);
      }
    });
  } else {
    Correction.findOneAndUpdate({ mid: id }, { $push: { pages: image_data } }, function (err, correctionsResult) {
      if (err) throw err;
    }).then(function(corrections) {
      if (next_page_num <= total_pages) {
        res.redirect('/markings/' + id + '/answers/' + aid + '/questions/' + qid + '/pages/' + next_page_num);
      } else {
        Answer.findByIdAndUpdate(aid, { status: 'reviewing',}, function(err, answersResult) {
          if (err) throw err;
        }).then(function(answers) {
          res.redirect('/answers/questions/' + qid); 
        });
      }
    });
  }
});

module.exports = router;