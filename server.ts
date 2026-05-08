import express from "express";
import path from "path";
import Razorpay from "razorpay";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Define Razorpay server-side routes
  app.post("/api/create-payment", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      
      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;

      if (!key_id || !key_secret) {
        return res.status(500).json({ error: "Razorpay keys are missing on the server. Please add them to your environment variables." });
      }

      const razorpay = new Razorpay({
        key_id,
        key_secret,
      });

      const options = {
        amount: amount * 100, // amount in the smallest currency unit
        currency,
        receipt: `receipt_order_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json({
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        key_id: key_id,
      });
    } catch (error) {
      console.error("Razorpay order creation error:", error);
      res.status(500).json({ error: "Failed to create Razorpay order" });
    }
  });

  // Example generic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support React Router fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
