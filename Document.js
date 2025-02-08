const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
    _id: String,
    data: Object,
    updates: [{
        userId: String,
        username: String,  // Added username field
        delta: Object,
        timestamp: { type: Date, default: Date.now }
    }]
},{ collection: "PratikDb" });

module.exports = mongoose.model("Document", DocumentSchema);
