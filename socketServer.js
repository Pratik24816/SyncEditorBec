const io = require("socket.io")(3001, {
    cors: {
      origin: "http://localhost:5173", // Change this to match your React client URL
      methods: ["GET", "POST"]
    }
  });
  
  const documentStore = {}; // Store document data in memory
  
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
  
    socket.on("get-document", ({ documentId, username }) => {
      if (!documentStore[documentId]) {
        documentStore[documentId] = { content: [], users: [] };
      }
  
      // Add user to the document room
      socket.join(documentId);
      documentStore[documentId].users.push(username);
  
      // Send document content to user
      socket.emit("load-document", documentStore[documentId].content);
  
      // Notify others
      socket.broadcast.to(documentId).emit("user-joined", username);
    });
  
    socket.on("send-changes", ({ delta, username }) => {
      const documentId = Object.keys(socket.rooms)[1]; // Get room ID
      if (documentId) {
        documentStore[documentId].content.push(delta);
        socket.broadcast.to(documentId).emit("receive-changes", { delta, username });
      }
    });
  
    socket.on("save-document", (content) => {
      const documentId = Object.keys(socket.rooms)[1];
      if (documentId) documentStore[documentId].content = content;
    });
  
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  