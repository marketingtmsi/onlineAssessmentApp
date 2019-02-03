var mongoose = require('mongoose');
var correctionsSchema = mongoose.Schema({
    aid: {type: mongoose.Schema.Types.ObjectId, ref: 'answers'},
    mid: {type: mongoose.Schema.Types.ObjectId, ref: 'markings'},
    pages: [{type: String}]
}, {
    versionKey: false
})
module.exports = mongoose.model('corrections', correctionsSchema);