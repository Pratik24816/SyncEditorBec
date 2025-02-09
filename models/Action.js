const mongoose = require("mongoose");

const ActionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
}, { collection: "Actions" });

module.exports = mongoose.model("Action", ActionSchema);
