// const mongoose = require("mongoose");
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const { ACTIONS } = "shared-utils/Action";
// const Document = require("./Document.js"); // Import the Document model

// const app = express();
// app.use(cors());

// const server = http.createServer(app);

// const MONGO_URI = "mongodb+srv://prajapatipm16:3ClpFm4uUsxIKPjM@portfolio.noz1l.mongodb.net/PortfolioDB?retryWrites=true&w=majority&appName=PortFolio";
// mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log(`✅ Connected to MongoDB`))
//     .catch(err => console.error("❌ Error connecting to MongoDB:", err));

// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// const userSocketMap = {};

// // Get all connected clients in a room (Only valid usernames)
// function getAllConnectedClients(roomId) {
//     return Array.from(io.sockets.adapter.rooms.get(roomId) || [])
//         .map((socketId) => ({
//             socketId,
//             username: userSocketMap[socketId] || null, // Use null instead of "Unknown User"
//         }))
//         .filter(client => client.username); // Only keep users with valid usernames
// }

// io.on("connection", (socket) => {
//     console.log(`🔌 Socket connected: ${socket.id}`);

//     // User joins a document room
//     socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
//         if (!username || username.trim() === "") return; // ✅ Prevent empty usernames
    
//         userSocketMap[socket.id] = username;
//         socket.join(roomId);
    
//         const clients = getAllConnectedClients(roomId);
//         clients.forEach(({ socketId }) => {
//             io.to(socketId).emit(ACTIONS.JOINED, {
//                 clients,
//                 username,
//                 socketId: socket.id,
//             });
//         });
//         console.log(`👤 ${username} joined room: ${roomId}`);
//     });

//     // Load document from DB or create new one
//     socket.on("get-document", async ({ documentId }) => {
//         const document = await findOrCreateDoc(documentId);
//         socket.join(documentId);
//         socket.emit("load-document", document);
//         console.log(`📜 Document ${documentId} loaded`);
//     });

//     // Save user changes in real time
//     socket.on("send-changes", async ({ documentId, userId, username, delta }) => {
//         socket.broadcast.to(documentId).emit("receive-changes", { userId, username, delta });

//         try {
//             await Document.findByIdAndUpdate(
//                 documentId,
//                 { $push: { updates: { userId, username, delta } } },
//                 { new: true }
//             );
//             console.log(`✏️ ${username} updated document: ${documentId}`);
//         } catch (error) {
//             console.error("❌ Error saving changes:", error);
//         }
//     });

//     // Save full document content to database
//     socket.on("save-document", async ({ documentId, data }) => {
//         try {
//             await Document.findByIdAndUpdate(
//                 documentId,
//                 { $set: { data } },
//                 { new: true, upsert: true }
//             );
//             console.log(`💾 Document ${documentId} saved successfully`);
//         } catch (error) {
//             console.error("❌ Error saving document:", error);
//         }
//     });

//     // Handle user disconnect
//     // socket.on("disconnecting", () => {
//     //     const username = userSocketMap[socket.id] || "Unknown User"; // ✅ Ensure username is always set
//     //     const rooms = [...socket.rooms];
//     //     rooms.forEach((roomId) => {
//     //         socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
//     //             socketId: socket.id,
//     //             username: userSocketMap[socket.id],
//     //         });
//     //     });
    
//     //     console.log(`🔴 User disconnected: ${username}`);
//     //     delete userSocketMap[socket.id]; // ✅ Ensure cleanup
//     //     socket.leave(); // Leave the room
//     // });

//     socket.on("disconnecting", () => {
//         const username = userSocketMap[socket.id]; // Get the username
//         const rooms = [...socket.rooms];
    
//         // ✅ Only notify others if the user has a valid name
//         if (username) {
//             rooms.forEach((roomId) => {
//                 socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
//                     socketId: socket.id,
//                     username,
//                 });
//             });
    
//             console.log(`🔴 ${username} left the room`);
//         }
    
//         delete userSocketMap[socket.id]; // ✅ Ensure cleanup
//         socket.leave(); // Leave the room
//     });
    
// });

// // Find or create document in MongoDB
// async function findOrCreateDoc(id) {
//     if (!id) return null;

//     let document = await Document.findById(id);
//     if (document) return document;

//     return await Document.create({ _id: id, data: {}, updates: [] });
// }

// server.listen(5000, () => console.log(`🚀 Server running on port 5000`));


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