
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const actionRoutes = require("./routes/actionRoutes"); // ✅ Import actions route
const Document = require("./Document"); // ✅ Import Document model

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://prajapatipm16:3ClpFm4uUsxIKPjM@portfolio.noz1l.mongodb.net/PortfolioDB?retryWrites=true&w=majority";
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // ✅ Prevent long connection delays
})
.then(() => console.log(`✅ Connected to MongoDB`))
.catch(err => console.error("❌ Error connecting to MongoDB:", err));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use("/api", actionRoutes); // ✅ Add API route

const userSocketMap = {};

// ✅ Event Constants
const JOIN = "join";
const JOINED = "joined";
const DISCONNECTED = "disconnected";

// Get all connected clients in a room (Only valid usernames)
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map((socketId) => ({
            socketId,
            username: userSocketMap[socketId] || null,
        }))
        .filter(client => client.username); // ✅ Only keep users with valid usernames
}

io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on(JOIN, ({ roomId, username }) => {
        if (!username || username.trim() === "") return; // ✅ Prevent empty usernames

        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
        console.log(`👤 ${username} joined room: ${roomId}`);
    });

    socket.on("get-document", async ({ documentId }) => {
        try {
            const document = await findOrCreateDoc(documentId);
            socket.join(documentId);
            socket.emit("load-document", document);
            console.log(`📜 Document ${documentId} loaded`);


            socket.on("file-imported",delta=>{
                socket.broadcast.to(documentId).emit("receive-file", delta);
            });


        } catch (error) {
            console.error("❌ Error loading document:", error);
        }
    });

    

    // Save user changes in real time
    socket.on("send-changes", async ({ documentId, userId, username, delta }) => {
        socket.broadcast.to(documentId).emit("receive-changes", { userId, username, delta });
        try {
            await Document.findByIdAndUpdate(
                documentId,
                { $push: { updates: { userId, username, delta } } },
                { new: true }
            );
            console.log(`✏️ ${username} updated document: ${documentId}`);
        } catch (error) {
            console.error("❌ Error saving changes:", error);
        }
    });

    socket.on("save-document", async ({ documentId, data }) => {
        try {
            await Document.findByIdAndUpdate(
                documentId,
                { $set: { data } },
                { new: true, upsert: true }
            );
            console.log(`💾 Document ${documentId} saved successfully`);
        } catch (error) {
            console.error("❌ Error saving document:", error);
        }
    });

    socket.on("disconnecting", () => {
        const username = userSocketMap[socket.id]; // ✅ Get username
        if (username) {
            [...socket.rooms].forEach((roomId) => {
                socket.to(roomId).emit(DISCONNECTED, {
                    socketId: socket.id,
                    username,
                });
            });
            console.log(`🔴 ${username} left the room`);
        }
        delete userSocketMap[socket.id]; // ✅ Ensure cleanup
    });
});

async function findOrCreateDoc(id) {
    if (!id) return null;
    let document = await Document.findById(id);
    if (document) return document;
    return await Document.create({ _id: id, data: {}, updates: [] });
}

server.listen(5000, () => console.log(`🚀 Server running on port 5000`));





// socket.on("get-document",async documentId=>{
//     const document=await findOrCreateDoc(documentId);
//     socket.join(documentId);
//     socket.emit("load-document",document.data)

//     socket.on("send-changes",delta=>{
//         socket.broadcast.to(documentId).emit("receive-changes",delta);
//         console.log(socket.id);
//         console.log(delta);
//         console.log(documentId);
//     });

//     socket.on("file-imported",delta=>{
//         socket.broadcast.to(documentId).emit("receive-file", delta);
//     });

//     socket.on("save-document",async data=>{
//         await Document.findByIdAndUpdate(documentId,{data});
//     });

// });