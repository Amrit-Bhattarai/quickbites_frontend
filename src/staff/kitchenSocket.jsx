import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectToKitchenSocket = (onMessageReceived) => {
  const socket = new SockJS("http://localhost:8080/ws");

  stompClient = new Client({
    webSocketFactory: () => socket,
    debug: function (str) {
      console.log(str);
    },
    onConnect: () => {
      stompClient.subscribe("/topic/kitchen-updates", (message) => {
        const event = JSON.parse(message.body);
        onMessageReceived(event);
      });
    },
    onStompError: (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
    },
  });

  stompClient.activate();
};

export const disconnectKitchenSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
  }
};
