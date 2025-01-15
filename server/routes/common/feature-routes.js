const express = require("express");

const {
  addFeatureImage,
  getFeatureImages,
  deleteFeatureImage,
  updateFeatureImage,
} = require("../../controllers/common/feature-controller");

const router = express.Router();

router.post("/add", addFeatureImage);
router.get("/get", getFeatureImages);
router.delete("/delete/:id", deleteFeatureImage);
router.put("/update/:id", updateFeatureImage);

module.exports = router;
