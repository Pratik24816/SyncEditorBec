const mongoose = require("mongoose");
const Action = require("./models/Action");

const MONGO_URI = "mongodb+srv://prajapatipm16:3ClpFm4uUsxIKPjM@portfolio.noz1l.mongodb.net/PortfolioDB?retryWrites=true&w=majority";

const ACTIONS_LIST = [
    "join",
    "joined",
    "disconnected",
    "code-change",
    "sync-code",
    "leave"
];

async function initializeActions() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        for (const action of ACTIONS_LIST) {
            await Action.updateOne(
                { name: action },
                { name: action },
                { upsert: true }
            );
        }

        console.log("✅ Actions initialized in MongoDB.");
    } catch (error) {
        console.error("❌ Error initializing actions:", error);
    } finally {
        mongoose.connection.close();
    }
}

initializeActions();
