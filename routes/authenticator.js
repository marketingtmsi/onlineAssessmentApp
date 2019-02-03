var authenticator = {
  checkSignIn: function (req, res, next) {
    if (req.session.user) {
      next();
    } else {
      var err = new Error('You are not authorised to view this page.');
      next(err);
    }
  },
  checkTeacherRole: function (req, res, next) {
    if (req.session.role == 'teacher') {
      next();
    } else {
      var err = new Error('You have no permission to view this page.');
      next(err);
    }
  }, 
  checkStudentRole: function (req, res, next) {
    if (req.session.role == 'student') {
      next();
    } else {
      var err = new Error('You have no permission to view this page.');
      next(err);
    }
  }
}

module.exports = authenticator;