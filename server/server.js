const express = require("express");
const morgan = require("morgan");
const env = require("dotenv");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const dbConnection = require("./database/dbConnection");
const AuthRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-route");
const adminOrderRouter = require("./routes/admin/order-route");

const shopProductsRouter = require("./routes/shop/products-route");
const shopCartRouter = require("./routes/shop/cart-route");
const shopAddressRouter = require("./routes/shop/address-route");
const shopOrderRouter = require("./routes/shop/order-route");
const ipnHandler = require("./routes/shop/ipn-route");

const shopSearchRouter = require("./routes/shop/search-route");
const shopReviewRouter = require("./routes/shop/review-route");

const commonFeatureRouter = require("./routes/common/feature-routes");
const getUserRouter = require("./routes/admin/getUser-route");

dbConnection();

const app = express();
app.use(morgan("dev"));
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", AuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin", getUserRouter);

app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);

app.post("/shop/payment-success", (req, res) => {
  res.redirect("http://localhost:5173/shop/payment-success");
});
app.post("/shop/paypal-return", (req, res) => {
  res.redirect("http://localhost:5173/shop/paypal-return");
});
app.use("/api/payment", ipnHandler);

app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);

app.use("/api/common/feature", commonFeatureRouter);

app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));
