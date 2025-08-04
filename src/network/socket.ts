import { io } from "socket.io-client";

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
export const socket = io(
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://massivesweeperback.onrender.com"
);

socket.on("connect", () => {
  console.log("Connected to backend Socket.io server");
  socket.emit("user_connect", userTokenInfo);
});

// Placeholder for future event handlers
// socket.on("reveal", ({ x, y }) => {
//   // Update state
// });
