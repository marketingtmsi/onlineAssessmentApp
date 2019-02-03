var mongoose = require('mongoose');
var markingsSchema = mongoose.Schema({
    aid: {type: mongoose.Schema.Types.ObjectId, ref: 'answers'},
    pages: [{type: String}]
}, {
    versionKey: false
}
);
module.exports = mongoose.model('markings', markingsSchema);