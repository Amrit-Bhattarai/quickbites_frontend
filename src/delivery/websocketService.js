import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = {};
  }

  connect(onConnectCallback) {
    const socket = new SockJS("http://localhost:8080/ws"); // Change to your WebSocket server URL

    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: function (str) {
        console.log(str);
      },
      onConnect: (frame) => {
        console.log("Connected: " + frame);
        if (onConnectCallback) onConnectCallback();
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    this.client.activate();
  }

  subscribe(topic, callback) {
    if (!this.client || !this.client.connected) {
      console.error("Client not connected");
      return;
    }
    if (this.subscriptions[topic]) {
      console.warn(`Already subscribed to ${topic}`);
      return;
    }
    const subscription = this.client.subscribe(topic, (message) => {
      callback(message);
    });
    this.subscriptions[topic] = subscription;
  }

  unsubscribe(topic) {
    if (this.subscriptions[topic]) {
      this.subscriptions[topic].unsubscribe();
      delete this.subscriptions[topic];
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.subscriptions = {};
    }
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
