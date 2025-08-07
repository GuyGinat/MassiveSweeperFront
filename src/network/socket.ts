import { io } from "socket.io-client";
import { getSocketUrl, CLIENT_EVENTS } from "../constants/socket";

/**
 * Get or create a user token for identification
 * @returns Object containing token and firstTime flag
 */
function getOrCreateToken() {
  const token = crypto.randomUUID();
  const firstTime = true;
  return { token, firstTime };
}

export const userTokenInfo = getOrCreateToken();

// Use environment-aware socket connection
export const socket = io(getSocketUrl());

socket.on("connect", () => {
  socket.emit(CLIENT_EVENTS.USER_CONNECT, userTokenInfo);
});

// Placeholder for future event handlers
// socket.on("reveal", ({ x, y }) => {
//   // Update state
// });
