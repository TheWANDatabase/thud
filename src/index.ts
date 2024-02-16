// Import modules
import { createServer } from "http";
import { Server } from "socket.io";
import {
  ActionTypes,
  type BroadcastMessage,
  type CoreMessage,
} from "./types/core";
import * as console from "node:console";
import express, { json } from "express";
import cors from "cors";
import { prometheus, stats } from "./types/metrics";



// Initialize the server
const app = express();
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

app.use(json());

// Create the http server
const http = createServer(app);

// Initialize the socket.io server
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    maxAge: 2592000,
  },
});

// Initialize the rooms
const rooms = {
  youtube: [] as string[],
  bingo: [] as string[],
  live: [] as string[],
};

// Initialize the sources
const sources = {
  whenplane: 0,
  bingo: 0,
  other: 0,
}


// Handle socket.io connections
io.on("connection", async (socket) => {

  console.log("connected");

  // Increment the appropriate metrics
  stats.connections.current.inc(1);
  if ((await stats.connections.current.get()).values[0].value > (await stats.connections.peak.get()).values[0].value)
    stats.connections.peak.set((await stats.connections.current.get()).values[0].value);


  // Determine the referrer
  const referrer = socket.request.headers.referer ?? "Unknown";

  if (/.*\.{0,1}whenplane\.com/.test(referrer)) {
    sources.whenplane++;
    stats.whenplane.connections.inc(1);
  } else if (/.*\.{0,1}wanshow\.bingo/.test(referrer)) {
    sources.bingo++;
    stats.bingo.connections.inc(1);
  } else {
    sources.other++;
  }

  // Handle socket.io disconnects
  socket.on("disconnect", () => {
    console.log("disconnected");

    // Decrement the appropriate metrics
    if (/.*\.{0,1}whenplane\.com/.test(referrer)) {
      sources.whenplane--;
      stats.whenplane.connections.dec(1);
    } else if (/.*\.{0,1}wanshow\.bingo/.test(referrer)) {
      sources.bingo--;
      stats.bingo.connections.dec(1);
    } else {
      sources.other--;
    }

    if (rooms.youtube.includes(socket.id)) {
      rooms.youtube = rooms.youtube.filter((id) => id !== socket.id);
      stats.youtube.connections.dec(1);
    }
    if (rooms.bingo.includes(socket.id)) rooms.bingo = rooms.bingo.filter((id) => id !== socket.id);
    if (rooms.live.includes(socket.id)) rooms.live = rooms.live.filter((id) => id !== socket.id);

    stats.connections.current.dec(1);
  });


  // Handle socket.io messages
  socket.on("message", (data, ack) => {
    stats.thud.messages.inc(1);
    stats.thud.messagesInbound.inc(1);
    const body = JSON.parse(data) as CoreMessage<unknown>;

    // Handle any subscription messages
    if (body.type === ActionTypes.SUBSCRIBE) {
      void socket.join(body.payload as string);
      switch (body.payload as string) {
        case "youtube":
          rooms.youtube.push(socket.id);
          stats.youtube.connections.inc(1);
          break;
        case "bingo":
          rooms.bingo.push(socket.id);
          break;
        case "live":
          rooms.live.push(socket.id);
          break;

        default:
          break;
      }
      if (ack !== undefined) ack("ok");

      // Handle any broadcast messages
    } else if (body.type === ActionTypes.BROADCAST) {
      const request = body as BroadcastMessage;
      console.log("broadcasting to " + request.payload.room);

      switch (request.payload.room) {
        case "youtube":
          stats.youtube.messages.inc(1);
          stats.youtube.messagesOutbound.inc(rooms.youtube.length);
          break;

        case "bingo":
          stats.bingo.messages.inc(1);
          stats.bingo.messagesOutbound.inc(rooms.bingo.length);
          break;

        case "live":
          stats.live.messages.inc(1);
          stats.live.messagesOutbound.inc(rooms.live.length);
          break;
      }

      void socket
        .to(request.payload.room)
        .emit(
          request.payload.event ?? "message",
          JSON.stringify(request.payload.data),
        );
      if (ack !== undefined) ack("ok");

      // Handle any leave messages
    } else if (body.type === ActionTypes.LEAVE) {
      void socket.leave(body.payload as string);
      switch (body.payload as string) {
        case "youtube":
          rooms.youtube = rooms.youtube.filter((id) => id !== socket.id);
          stats.youtube.connections.dec(1);
          break;
        case "bingo":
          rooms.bingo = rooms.bingo.filter((id) => id !== socket.id);
          break;
        case "live":
          rooms.live = rooms.live.filter((id) => id !== socket.id);
          break;

        default:
          break;
      }
    } else {
      console.log(body);
    }
  });
});

// Handle the root route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", prometheus.contentType);
  res.send(await prometheus.register.metrics());
});

app.post("/yt/:id", (req, res) => {
  stats.thud.messages.inc(1);
  stats.youtube.messages.inc(1);
  stats.youtube.messagesInbound.inc(1);
  stats.youtube.messagesOutbound.inc(rooms.youtube.length);

  io.to("youtube").emit("stream_detector", JSON.stringify({
    id: req.params.id,
    body: req.body
  }));
  res.status(200).send("ok");
})

// Handle bingo tile updates
app.post("/tiles", (req, res) => {
  const data = req.body;

  stats.thud.messages.inc(1);
  stats.bingo.messages.inc(1);
  stats.bingo.messagesInbound.inc(1);
  stats.bingo.messagesOutbound.inc(rooms.bingo.length);

  io.to(data.payload.room).emit(
    data.payload.event ?? "message",
    JSON.stringify(data.payload.data),
  );
  res.end("ok");
});

http.listen(15674, () => {
  console.log("listening on *:15674");
});