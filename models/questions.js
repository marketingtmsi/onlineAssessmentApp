var mongoose = require('mongoose');
var questionSchema = mongoose.Schema({
    set: Number,
    name: String,
    thumbnail: String,
    pages: mongoose.Schema.Types.Array,
    total_marks: Number
});
module.exports = mongoose.model('questions', questionSchema);