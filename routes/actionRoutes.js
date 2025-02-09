const express = require("express");
const router = express.Router();
const Action = require("../models/Action");

router.get("/actions", async (req, res) => {
    try {
        const actions = await Action.find({});
        res.json(actions.map(action => action.name));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
