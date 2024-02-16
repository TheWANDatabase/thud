import * as prometheus from "prom-client";


const defaultMetrics = prometheus.collectDefaultMetrics;

const stats = {
  connections: {
    current: new prometheus.Gauge({
      name: "thud_connections",
      help: "Number of connections",
    }),
    peak: new prometheus.Gauge({
      name: "thud_connections_peak",
      help: "Number of connections at peak",
    }),
    created: new prometheus.Counter({
      name: "thud_connections_created",
      help: "Number of connections created",
    }),
    terminated: new prometheus.Counter({
      name: "thud_connections_terminated",
      help: "Number of connections terminated",
    }),
    total: new prometheus.Counter({
      name: "thud_connections_total",
      help: "Number of connections total",
    }),
  },
  thud: {
    messages: new prometheus.Gauge({
      name: "thud_thud_messages",
      help: "Number of thud messages",
    }),
    messagesInbound: new prometheus.Gauge({
      name: "thud_thud_messages_inbound",
      help: "Number of thud messages",
    }),
    messagesOutbound: new prometheus.Gauge({
      name: "thud_thud_messages_outbound",
      help: "Number of thud messages",
    }),
  },
  chat: {
    connections: new prometheus.Gauge({
      name: "thud_chat_connections",
      help: "Number of chat connections",
    }),
    messages: new prometheus.Gauge({
      name: "thud_chat_messages",
      help: "Number of chat messages",
    }),
    messagesInbound: new prometheus.Gauge({
      name: "thud_chat_messages_inbound",
      help: "Number of chat messages",
    }),
    messagesOutbound: new prometheus.Gauge({
      name: "thud_chat_messages_outbound",
      help: "Number of chat messages",
    }),
  },
  whenplane: {
    connections: new prometheus.Gauge({
      name: "thud_whenplane_connections",
      help: "Number of whenplane connections",
    }),
    messages: new prometheus.Gauge({
      name: "thud_whenplane_messages",
      help: "Number of whenplane messages",
    }),
    messagesInbound: new prometheus.Gauge({
      name: "thud_whenplane_messages_inbound",
      help: "Number of whenplane messages",
    }),
    messagesOutbound: new prometheus.Gauge({
      name: "thud_whenplane_messages_outbound",
      help: "Number of whenplane messages",
    }),
  },
  youtube: {
    connections: new prometheus.Gauge({
      name: "thud_youtube_connections",
      help: "Number of youtube connections",
    }),
    messages: new prometheus.Gauge({
      name: "thud_youtube_messages",
      help: "Number of youtube messages",
    }),
    messagesInbound: new prometheus.Gauge({
      name: "thud_youtube_messages_inbound",
      help: "Number of youtube messages",
    }),
    messagesOutbound: new prometheus.Gauge({
      name: "thud_youtube_messages_outbound",
      help: "Number of youtube messages",
    }),
  },
  bingo: {
    connections: new prometheus.Gauge({
      name: "thud_bingo_connections",
      help: "Number of bingo connections",
    }),
    messages: new prometheus.Gauge({
      name: "thud_bingo_messages",
      help: "Number of bingo messages",
    }),
    messagesInbound: new prometheus.Gauge({
      name: "thud_bingo_messages_inbound",
      help: "Number of bingo messages",
    }),
    messagesOutbound: new prometheus.Gauge({
      name: "thud_bingo_messages_outbound",
      help: "Number of bingo messages",
    }),
  },
  live: {
    connections: new prometheus.Gauge({
      name: "thud_live_connections",
      help: "Number of live connections",
    }),
    messages: new prometheus.Gauge({
      name: "thud_live_messages",
      help: "Number of live messages",
    }),
    messagesInbound: new prometheus.Gauge({
      name: "thud_live_messages_inbound",
      help: "Number of live messages",
    }),
    messagesOutbound: new prometheus.Gauge({
      name: "thud_live_messages_outbound",
      help: "Number of live messages",
    }),
  },
};

prometheus.register.registerMetric(stats.connections.current);
prometheus.register.registerMetric(stats.connections.peak);
prometheus.register.registerMetric(stats.connections.created);
prometheus.register.registerMetric(stats.connections.terminated);
prometheus.register.registerMetric(stats.connections.total);
prometheus.register.registerMetric(stats.thud.messages);
prometheus.register.registerMetric(stats.thud.messagesInbound);
prometheus.register.registerMetric(stats.thud.messagesOutbound);
prometheus.register.registerMetric(stats.chat.connections);
prometheus.register.registerMetric(stats.chat.messages);
prometheus.register.registerMetric(stats.chat.messagesInbound);
prometheus.register.registerMetric(stats.chat.messagesOutbound);
prometheus.register.registerMetric(stats.whenplane.connections);
prometheus.register.registerMetric(stats.whenplane.messages);
prometheus.register.registerMetric(stats.whenplane.messagesInbound);
prometheus.register.registerMetric(stats.whenplane.messagesOutbound);
prometheus.register.registerMetric(stats.youtube.connections);
prometheus.register.registerMetric(stats.youtube.messages);
prometheus.register.registerMetric(stats.youtube.messagesInbound);
prometheus.register.registerMetric(stats.youtube.messagesOutbound);
prometheus.register.registerMetric(stats.bingo.connections);
prometheus.register.registerMetric(stats.bingo.messages);
prometheus.register.registerMetric(stats.bingo.messagesInbound);
prometheus.register.registerMetric(stats.bingo.messagesOutbound);
prometheus.register.registerMetric(stats.live.connections);
prometheus.register.registerMetric(stats.live.messages);
prometheus.register.registerMetric(stats.live.messagesInbound);
prometheus.register.registerMetric(stats.live.messagesOutbound);


defaultMetrics({
  prefix: "thud_",
  labels: {
    pid: process.pid,
    version: "1.0.0",
  }
});


export {
  prometheus,
  stats,
}