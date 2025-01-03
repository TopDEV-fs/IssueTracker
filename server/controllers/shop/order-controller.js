// const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const env = require("dotenv");

const SSLCommerzPayment = require("sslcommerz-lts");
const STORE_ID = "smg675597b60f4f0";
const STORE_PASSWORD = "smg675597b60f4f0@ssl";
const IS_LIVE = false; // true for live server, false for sandbox

// SSL

const createOrder = async (req, res) => {
  const {
    userName,
    userId,
    cartItems,
    addressInfo,
    orderStatus,
    paymentMethod,
    paymentStatus,
    totalAmount,
    orderDate,
    orderUpdateDate,
    paymentId,
    payerId,
    cartId,
  } = req.body;

  // Ensure required fields are present
  // if (
  //   !addressInfo ||
  //   !totalAmount ||
  //   !addressInfo.fullName ||
  //   !addressInfo.email ||
  //   !addressInfo.phone ||
  //   !addressInfo.address ||
  //   !addressInfo.city ||
  //   !addressInfo.pincode
  // ) {
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "Missing required fields." });
  // }

  // Create a new order in the database
  const newOrder = new Order({
    userName,
    userId,
    cartId,
    cartItems,
    addressInfo,
    orderStatus: orderStatus || "Pending",
    paymentMethod,
    paymentStatus: paymentStatus || "Pending",
    totalAmount,
    orderDate: orderDate || new Date(),
    orderUpdateDate: orderUpdateDate || new Date(),
    paymentId,
    payerId,
  });

  try {
    await newOrder.save();
    const tranId = `TXN_${newOrder._id}`;

    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASSWORD, IS_LIVE);

    const data = {
      total_amount: totalAmount,
      currency: "BDT",
      tran_id: tranId, // Use the order ID as transaction ID
      success_url: "http://localhost:5000/shop/paypal-return",
      fail_url: "http://localhost:5000/shop/payment-fail",
      cancel_url: "http://localhost:5000/shop/payment-cancel",
      product_name: "E-commerce Products",
      product_category: "E-commerce",
      product_profile: "general",
      cus_name: addressInfo.userName,
      cus_email: addressInfo.email,
      cus_add1: addressInfo.address,
      cus_city: addressInfo.city,
      cus_postcode: addressInfo.pincode,
      cus_phone: addressInfo.phone,
      ship_name: "cargo",
      ship_add1: addressInfo.address,
      ship_city: addressInfo.city,
      ship_postcode: addressInfo.pincode,
      shipping_method: "Courier",
      ship_country: "Bangladesh",
    };
    // console.log(data);

    // // Initialize payment session with SSLCommerz
    const sslcommerzResponse = await sslcz.init(data);
    // console.log(sslcommerzResponse);

    if (sslcommerzResponse?.status === "SUCCESS") {
      return res.json({
        success: true,
        approvalURL: sslcommerzResponse.GatewayPageURL,
        orderId: newOrder._id,
      });
    } else {
      console.error("SSLCommerz Initialization Error:", sslcommerzResponse);
      return res.status(500).json({
        success: false,
        message:
          sslcommerzResponse?.failedreason ||
          "Failed to create payment session.",
      });
    }
  } catch (error) {
    console.error("Error while creating order or initializing payment:", error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while creating the order or initializing the payment session.",
    });
  }
};

const ipnHandler = async (req, res) => {
  try {
    // Parse the IPN request data
    const {
      tran_id,
      val_id,
      amount,
      card_type,
      store_amount,
      currency,
      risk_level,
      status,
    } = req.body;

    // Check if the transaction ID exists
    if (!tran_id) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is missing in the IPN data.",
      });
    }

    // Find the order by transaction ID
    const order = await Order.findOne({ paymentId: tran_id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for the given transaction ID.",
      });
    }

    // Verify payment with SSLCommerz
    const sslcz = new SSLCommerzPayment(
      process.env.STORE_ID,
      process.env.STORE_PASSWORD,
      process.env.IS_LIVE === "true"
    );
    const validationResponse = await sslcz.validate(val_id);

    if (
      validationResponse?.status === "VALID" &&
      validationResponse?.tran_id === tran_id
    ) {
      // Update the order status in your database
      order.paymentStatus = "Paid";
      order.orderStatus = "Confirmed";
      order.payerId = validationResponse.ssl_id || order.payerId; // Update payerId if ssl_id is available
      order.paymentMethod = card_type;
      await order.save();

      return res.json({
        success: true,
        message: "Payment verified and order updated successfully.",
      });
    } else {
      // Payment validation failed
      order.paymentStatus = "Failed";
      order.orderStatus = "Cancelled";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment validation failed.",
      });
    }
  } catch (error) {
    console.error("Error handling IPN request:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the IPN request.",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Not enough stock for this product ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;

      await product.save();
    }

    const getCartId = order.cartId;
    await Cart.findByIdAndDelete(getCartId);

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
  ipnHandler,
};
