const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const env = require("dotenv");

// Paypal
const createOrder = async (req, res) => {
  try {
    const {
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

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:5173/shop/paypal-return",
        cancel_url: "http://localhost:5173/shop/paypal-cancel",
      },
      transactions: [
        {
          item_list: {
            items: cartItems.map((item) => ({
              name: item.title,
              sku: item.productId,
              price: item.price.toFixed(2),
              currency: "USD",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "USD",
            total: totalAmount.toFixed(2),
          },
          description: "description",
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      if (error) {
        console.log(error);

        return res.status(500).json({
          success: false,
          message: "Error while creating paypal payment",
        });
      } else {
        const newlyCreatedOrder = new Order({
          userId,
          cartId,
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
        });

        await newlyCreatedOrder.save();

        const approvalURL = paymentInfo.links.find(
          (link) => link.rel === "approval_url"
        ).href;

        res.status(201).json({
          success: true,
          approvalURL,
          orderId: newlyCreatedOrder._id,
        });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

// const SSLCommerz = require("sslcommerz-lts");
// const store_id = "smg675597b60f4f0";
// const store_password = "smg675597b60f4f0@ssl";
// const is_live = false; // true for live server, false for sandbox

// SSL
// const createOrder = async (req, res) => {
//   try {
//     const {
//       userId,
//       cartItems,
//       addressInfo,
//       orderStatus,
//       paymentMethod,
//       paymentStatus,
//       totalAmount,
//       orderDate,
//       orderUpdateDate,
//       cartId,
//     } = req.body;

//     const transactionId = `TXN_${Date.now()}`;
//     const sslcz = new SSLCommerz(store_id, store_password, is_live);

//     const data = {
//       total_amount: totalAmount, // Amount to be charged
//       currency: "BDT",
//       tran_id: transactionId, // Unique transaction ID
//       success_url: "http://localhost:5173/shop/sslcommerz-success",
//       fail_url: "http://localhost:5173/shop/sslcommerz-fail",
//       cancel_url: "http://localhost:5173/shop/sslcommerz-cancel",
//       ipn_url: "http://localhost:5173/shop/sslcommerz-ipn",
//       shipping_method: "Courier",
//       product_name: "Shopping Cart Items",
//       product_category: "E-commerce",
//       product_profile: "general",
//       cus_name: addressInfo.fullName,
//       cus_email: addressInfo.email,
//       cus_add1: addressInfo.address,
//       cus_city: addressInfo.city,
//       cus_state: addressInfo.state,
//       cus_postcode: addressInfo.postcode,
//       cus_country: "Bangladesh",
//       cus_phone: addressInfo.phone,
//       ship_name: addressInfo.fullName,
//       ship_add1: addressInfo.address,
//       ship_city: addressInfo.city,
//       ship_state: addressInfo.state,
//       ship_postcode: addressInfo.postcode,
//       ship_country: "Bangladesh",
//     };

//     // Initiate the payment request
//     sslcz.init(data).then(async (apiResponse) => {
//       console.log(apiResponse);
//       const { GatewayPageURL, status } = apiResponse;

//       if (status !== "SUCCESS") {
//         return res.status(500).json({
//           success: false,
//           message: "Error while creating SSLCommerz payment session",
//         });
//       }

//       // Save order details to the database
//       const newlyCreatedOrder = new Order({
//         userId,
//         cartId,
//         cartItems,
//         addressInfo,
//         orderStatus,
//         paymentMethod: "SSLCommerz",
//         paymentStatus: "Pending",
//         totalAmount,
//         orderDate,
//         orderUpdateDate,
//         paymentId: transactionId,
//       });

//       await newlyCreatedOrder.save();

//       // Return the payment URL
//       res.status(201).json({
//         success: true,
//         approvalURL: GatewayPageURL,
//         orderId: newlyCreatedOrder._id,
//       });
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occurred!",
//     });
//   }
// };

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
};
