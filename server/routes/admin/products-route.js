const express = require("express");

const {
  handleImageUpload,
  addProduct,
  editProduct,
  fetchAllProducts,
  deleteProduct,
} = require("../../controllers/admin/product-controllers");

const { upload } = require("../../helpers/cloudinary");

const adminProductsRouter = express.Router();

adminProductsRouter.post(
  "/upload-image",
  upload.single("my_file"),
  handleImageUpload
);
adminProductsRouter.post("/add", addProduct);
adminProductsRouter.put("/edit/:id", editProduct);
adminProductsRouter.delete("/delete/:id", deleteProduct);
adminProductsRouter.get("/get", fetchAllProducts);

module.exports = adminProductsRouter;
