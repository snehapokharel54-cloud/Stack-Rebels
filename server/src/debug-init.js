import { initializeApp } from "./app.js";

console.log("Starting initializeApp test...");
initializeApp().then(() => {
  console.log("initializeApp completed!");
  process.exit(0);
}).catch(err => {
  console.error("initializeApp failed:", err);
  process.exit(1);
});
