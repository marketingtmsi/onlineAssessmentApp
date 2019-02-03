var mongoose = require('mongoose');
var pagesSchema = mongoose.Schema({
    name: String,
    image: String
});
module.exports = mongoose.model('pages', pagesSchema);