import { createServer } from "http";
import { Server } from "socket.io";
import {
  ActionTypes,
  type BroadcastMessage,
  type CoreMessage,
} from "./types/core";
import { instrument } from "@socket.io/admin-ui";
import * as console from "console";
// @ts-expect-error Types do not exist for this module
import ioMetrics from "socket.io-prometheus";
import { register as promRegister } from "prom-client";

const stats: any = {
  connections: {
    peak: 0,
    current: 0,
  },
  mem: process.memoryUsage(),
};

const httpServer = createServer(requestHandler);

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

// start collecting socket.io metrics
ioMetrics(io);

io.on("connection", (socket) => {
  console.log("connected");
  stats.connections.current += 1;
  if (stats.connections.current > stats.connections.peak)
    stats.connections.peak = stats.connections.current;

  socket.on("disconnect", () => {
    console.log("disconnected");
    stats.connections.current -= 1;
  });

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

httpServer.listen(80, () => {
  console.log("listening on *:80");
});

function requestHandler(req: any, res: any): void {
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
  } else if (req.url === "/stats") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(stats));
  } else if (req.url === "/metrics" && req.method === "GET") {
    res.setHeader("Content-Type", promRegister.contentType);
    promRegister.metrics().then(res.end);
  } else if (req.url === "/tiles" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      const data = JSON.parse(body);
      console.log(data);
      io.to(data.payload.room).emit(
        data.payload.event ?? "message",
        JSON.stringify(data.payload.data),
      );
      res.end("ok");
    });
  }
}
