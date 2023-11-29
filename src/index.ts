import { createServer } from "http";
import { Server } from "socket.io";
import {
  ActionTypes,
  type BroadcastMessage,
  type CoreMessage,
} from "./types/core";

import { instrument } from "@socket.io/admin-ui";

const httpServer = createServer((req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*" /* @dev First, read about security */,
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
    "Access-Control-Max-Age": 2592000, // 30 days
    /** add other headers as per requirement */
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  console.log(req.method, req.url);
  if (req.url === "/") {
    res.end("Hello world");
  } else if (req.url === "/tiles" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const data = JSON.parse(body);
      io.to(data.payload.room).emit(
        data.payload.event ?? "message",
        JSON.stringify(data.payload.data),
      );
      res.end("ok");
    });
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

instrument(io, {
  auth: {
    type: "basic",
    username: "admin",
    password: "$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS", // "changeit" encrypted with bcrypt
  },
  mode: "development",
});

io.on("connection", (socket) => {
  console.log("connected");
  socket.on("message", (data, ack) => {
    const body = JSON.parse(data) as CoreMessage<unknown>;

    if (body.type === ActionTypes.SUBSCRIBE) {
      void socket.join(body.payload as string);
      if (ack !== undefined) ack("ok");
    } else if (body.type === ActionTypes.BROADCAST) {
      const request = body as BroadcastMessage;
      console.log("broadcasting to " + request.payload.room);
      void socket
        .to(request.payload.room)
        .emit(
          request.payload.event ?? "message",
          JSON.stringify(request.payload.data),
        );
      if (ack !== undefined) ack("ok");
    } else if (body.type === ActionTypes.LEAVE) {
      void socket.leave(body.payload as string);
      if (ack !== undefined) ack("ok");
    } else {
      console.log(body);
    }
  });
});

httpServer.listen(3000, () => {
  console.log("listening on *:3000");
});
