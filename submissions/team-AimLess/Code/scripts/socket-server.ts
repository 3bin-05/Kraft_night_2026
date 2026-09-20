import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "GABRIEL_SOCKET_SERVER", port: PORT }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("GABRIEL Real-Time Socket.IO Server is running.");
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO Server] Client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

  // Standard GABRIEL Event Relay Map
  const relayEvents = [
    "ambulance:location_updated",
    "ambulance:assigned",
    "ambulance:status_changed",
    "incident:created",
    "incident:updated",
    "incident:status_changed",
    "hospital:alert",
    "hospital:status_updated",
    "hospital:eta_updated",
    "routing:start",
    "routing:update",
    "routing:completed",
    "routing:reroute",
    "routing:error",
    "routing:request",
    "routing:response",
    "routing:service_online",
    "notification:new",
  ];

  relayEvents.forEach((eventName) => {
    socket.on(eventName, (data) => {
      // Broadcast event to all other connected clients (browsers, Python router, ambulances)
      socket.broadcast.emit(eventName, data);
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket.IO Server] Client disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  GABRIEL REAL-TIME SOCKET.IO SERVER RUNNING ON PORT ${PORT}`);
  console.log(`  Bridge Active: Next.js <---> Python Router <---> PostgreSQL`);
  console.log(`=======================================================`);
});
