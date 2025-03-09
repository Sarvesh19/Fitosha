// trackingWorker.js
let elapsedTime = 0;
let lastUpdateTime = Date.now();

self.onmessage = (event) => {
  const { type } = event.data;

  if (type === "start") {
    lastUpdateTime = Date.now();
    elapsedTime = 0;
    setInterval(() => {
      const now = Date.now();
      elapsedTime += (now - lastUpdateTime) / 1000; // Calculate elapsed time in seconds
      lastUpdateTime = now;
      self.postMessage({ type: "tick", elapsedTime });
    }, 1000); // Update every second
  }

  if (type === "stop") {
    elapsedTime = 0;
  }
};