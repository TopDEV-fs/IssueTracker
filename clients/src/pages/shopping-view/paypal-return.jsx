import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";

function PaypalReturnPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentId = params.get("paymentId");
  const payerId = params.get("PayerID");

  useEffect(() => {
    if (paymentId && payerId) {
      const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

      dispatch(capturePayment({ paymentId, payerId, orderId })).then((data) => {
        if (data?.payload?.success) {
          sessionStorage.removeItem("currentOrderId");
          console.log(window.location.href);
          window.location.href = "/shop/payment-success";
        }
      });
    }
  }, [paymentId, payerId, dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Payment...Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default PaypalReturnPage;

// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
// import axios from "axios"; // Axios for API calls
// import { useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";

// function PaypalReturnPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const params = new URLSearchParams(location.search);
//   const paymentId = params.get("paymentId");
//   const payerId = params.get("PayerID");

//   useEffect(() => {
//     const handlePaymentCapture = async () => {
//       if (paymentId && payerId) {
//         const orderId = JSON.parse(sessionStorage.getItem("currentOrderId"));

//         try {
//           // Send the payment details to the backend
//           const response = await axios.post(
//             "http://localhost:5000/api/shop/order/capture",
//             {
//               paymentId,
//               payerId,
//               orderId,
//             }
//           );

//           if (response.data.success) {
//             // Clear the current order ID and redirect to success page
//             sessionStorage.removeItem("currentOrderId");
//             navigate("/shop/payment-success");
//           } else {
//             // Handle failure, redirect to a failure page or show a message
//             console.error("Payment capture failed:", response.data.message);
//             navigate("/shop/payment-failure");
//           }
//         } catch (error) {
//           console.error("Error capturing payment:", error);
//           navigate("/shop/payment-return");
//         }
//       }
//     };

//     handlePaymentCapture();
//   }, [paymentId, payerId, navigate]);

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Processing Payment...Please wait!</CardTitle>
//       </CardHeader>
//     </Card>
//   );
// }

// export default PaypalReturnPage;
