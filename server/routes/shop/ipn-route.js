const express = require("express");
const { ipnHandler } = require("../../controllers/shop/order-controller");

const router = express.Router();

// Route for handling SSLCommerz IPN
router.post("/ssl-ipn", ipnHandler);

module.exports = router;
