const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = http.createServer();

const io = new Server(httpServer, {
  transports: ["websocket", "polling"],
  // path: "/",
  cors: {
    origin: "*", // Replace with your frontend URL
    methods: ["GET", "POST"],
    //allowedHeaders: ["my-custom-header"],
    credentials: false,
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected :${socket.id}`);

  // Triggered when a peer hits the join room button.
  socket.on("join", (roomName) => {
    console.log("roomName", roomName);
    const { rooms } = io.sockets.adapter;
    const room = rooms.get(roomName);

    console.log("room", room);

    // room == undefined when no such room exists.
    if (room === undefined) {
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size === 1) {
      // room.size == 1 when one person is inside the room.
      socket.join(roomName);
      socket.emit("joined");
    } else {
      // when there are already two people inside the room.
      socket.emit("full");
    }

    console.log(rooms);

    socket.on("disconnect", () => {
      socket.broadcast.to(roomName).emit("leave");
    });

    socket.on("is-parent", () => {
      socket.broadcast.to(roomName).emit("is-parent");
    });

    // Triggered when the person who joined the room is ready to communicate.
    socket.on("ready", () => {
      socket.broadcast.to(roomName).emit("ready"); // Informs the other peer in the room.
    });

    // Triggered when server gets an icecandidate from a peer in the room.
    socket.on("ice-candidate", (candidate) => {
      console.log("ICE", roomName);
      socket.broadcast.to(roomName).emit("ice-candidate", candidate); // Sends Candidate to the other peer in the room.
    });

    // Triggered when server gets an description from a peer in the room.
    socket.on("description", (description) => {
      socket.broadcast.to(roomName).emit("description", description); // Sends Candidate to the other peer in the room.
    });

    // Triggered when server gets an offer from a peer in the room.
    socket.on("offer", (offer) => {
      socket.broadcast.to(roomName).emit("offer", offer); // Sends Offer to the other peer in the room.
    });

    // Triggered when server gets an answer from a peer in the room
    socket.on("answer", (answer) => {
      socket.broadcast.to(roomName).emit("answer", answer); // Sends Answer to the other peer in the room.
    });

    socket.on("leave", () => {
      socket.leave(roomName);
      socket.broadcast.to(roomName).emit("leave");
    });
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
httpServer.listen(PORT, HOST, () => {
  console.log(httpServer.address());
  console.log(`Socket.io server is running on port ${PORT}`);
});
