// const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const env = require("dotenv");

const SSLCommerzPayment = require("sslcommerz-lts");
const STORE_ID = "smg675597b60f4f0";
const STORE_PASSWORD = "smg675597b60f4f0@ssl";
const is_live = false; // true for live server, false for sandbox

// SSL
const createOrder = async (req, res) => {
  const { totalAmount, addressInfo, cartItems, userId } = req.body;

  const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASSWORD, is_live);

  const data = {
    total_amount: totalAmount,
    currency: "BDT",
    tran_id: `TXN_${Date.now()}`, // Unique transaction ID
    success_url: "http://localhost:5173/shop/payment-success",
    fail_url: "http://localhost:5173/shop/paypal-return",
    // cancel_url: "http://yourdomain.com/cancel",
    // ipn_url: "http://yourdomain.com/ipn", // Instant Payment Notification
    product_name: "E-commerce Products",
    product_category: "E-commerce",
    product_profile: "general",
    cus_name: addressInfo.fullName,
    cus_email: addressInfo.email,
    cus_add1: addressInfo.address,
    cus_city: addressInfo.city,
    cus_postcode: addressInfo.pincode,
    cus_phone: addressInfo.phone,
    // ship_name: addressInfo.fullName,
    ship_add1: addressInfo.address,
    ship_city: addressInfo.city,
    ship_postcode: addressInfo.pincode,
    shipping_method: "Courier",
    ship_name: "Cargo",
    ship_country: "Bangladesh",
  };

  try {
    const sslcommerzResponse = await sslcz.init(data);
    console.log(sslcommerzResponse);

    if (sslcommerzResponse.status === "SUCCESS") {
      res.json({
        success: true,
        approvalURL: sslcommerzResponse.GatewayPageURL,
      });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to create payment session" });
    }
  } catch (error) {
    console.error("SSLCommerz Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// const capturePayment = async (req, res) => {
//   try {
//     const { paymentId, payerId, orderId } = req.body;

//     let order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order can not be found",
//       });
//     }

//     order.paymentStatus = "paid";
//     order.orderStatus = "confirmed";
//     order.paymentId = paymentId;
//     order.payerId = payerId;

//     for (let item of order.cartItems) {
//       let product = await Product.findById(item.productId);

//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Not enough stock for this product ${product.title}`,
//         });
//       }

//       product.totalStock -= item.quantity;

//       await product.save();
//     }

//     const getCartId = order.cartId;
//     await Cart.findByIdAndDelete(getCartId);

//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: "Order confirmed",
//       data: order,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

const capturePayment = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    // Validate the request body
    if (!paymentId || !payerId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: paymentId, payerId, or orderId",
      });
    }

    // Fetch the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update the order's payment and status fields
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    // Deduct stock for each item in the order
    for (const item of order.cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product: ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    // Remove the associated cart after confirming the order
    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    // Save the updated order
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error in capturePayment:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the payment",
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
};
