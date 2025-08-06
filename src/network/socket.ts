import { io } from "socket.io-client";
import { getSocketUrl, CLIENT_EVENTS } from "../constants/socket";

/**
 * Get or create a user token for identification
 * @returns Object containing token and firstTime flag
 */
function getOrCreateToken() {
  let token = localStorage.getItem("ms_token");
  let firstTime = false;
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("ms_token", token);
    firstTime = true;
  }
  return { token, firstTime };
}

export const userTokenInfo = getOrCreateToken();

// Use environment-aware socket connection
export const socket = io(getSocketUrl());

socket.on("connect", () => {
  console.log("Connected to backend Socket.io server");
  socket.emit(CLIENT_EVENTS.USER_CONNECT, userTokenInfo);
});

// Placeholder for future event handlers
// socket.on("reveal", ({ x, y }) => {
//   // Update state
// });
