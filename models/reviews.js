var mongoose = require('mongoose');
var reviewsSchema = mongoose.Schema({
    aid: {type: mongoose.Schema.Types.ObjectId, ref: 'answers'},
    mid: {type: mongoose.Schema.Types.ObjectId, ref: 'markings'},
    cid: {type: mongoose.Schema.Types.ObjectId, ref: 'corrections'},
    pages: [{type: String}]
}, {
    versionKey: false
});
module.exports = mongoose.model('reviews', reviewsSchema);