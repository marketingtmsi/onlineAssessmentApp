var mongoose = require('mongoose');
var answersSchema = mongoose.Schema({
    username: String,
    attempt: Number,
    qid: {type: mongoose.Schema.Types.ObjectId, ref: 'questions'},
    pages: [{type: String}],
    status: String, 
    marks: Number
}, {
    versionKey: false
});
module.exports = mongoose.model('answers', answersSchema);