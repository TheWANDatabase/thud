import { createServer } from "http";
import { Server } from "socket.io";
import {
  ActionTypes,
  type BroadcastMessage,
  type CoreMessage,
} from "./types/core";
import { instrument } from "@socket.io/admin-ui";
import * as console from "console"; // @ts-expect-error Types do not exist for this module
import ioMetrics from "socket.io-prometheus";
import { register as promRegister } from "prom-client";
import express from "express";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

const stats: any = {
  connections: {
    peak: 0,
    current: 0,
  },
  mem: process.memoryUsage(),
};

const http = createServer(app);

const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    maxAge: 2592000,
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

http.listen(80, () => {
  console.log("listening on *:80");
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/stats", (req, res) => {
  res.json(stats);
});

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", promRegister.contentType);
  res.send(await promRegister.metrics());
});

app.post("/tiles", (req, res) => {
  const body = req.body;
  const data = JSON.parse(body);
  console.log(data);
  io.to(data.payload.room).emit(
    data.payload.event ?? "message",
    JSON.stringify(data.payload.data),
  );
  res.end("ok");
});
