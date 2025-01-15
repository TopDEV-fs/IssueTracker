// const Feature = require("../../models/Feature");

// const addFeatureImage = async (req, res) => {
//   try {
//     const { image } = req.body;

//     console.log(image, "image");

//     const featureImages = new Feature({
//       image,
//     });

//     await featureImages.save();

//     res.status(201).json({
//       success: true,
//       data: featureImages,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// const getFeatureImages = async (req, res) => {
//   try {
//     const images = await Feature.find({});

//     res.status(200).json({
//       success: true,
//       data: images,
//     });
//   } catch (e) {
//     console.log(e);
//     res.status(500).json({
//       success: false,
//       message: "Some error occured!",
//     });
//   }
// };

// module.exports = { addFeatureImage, getFeatureImages };

const Feature = require("../../models/Feature");

// Add Feature Image
const addFeatureImage = async (req, res) => {
  try {
    const { image } = req.body;

    const featureImages = new Feature({ image });

    await featureImages.save();

    res.status(201).json({
      success: true,
      data: featureImages,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// Get Feature Images
const getFeatureImages = async (req, res) => {
  try {
    const images = await Feature.find({}).sort({ createdAt: -1 }); // Sort by latest first
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// Delete Feature Image
const deleteFeatureImage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFeature = await Feature.findByIdAndDelete(id);

    if (!deletedFeature) {
      return res.status(404).json({
        success: false,
        message: "Feature image not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Feature image deleted successfully!",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// Update Feature Image
const updateFeatureImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;

    const updatedFeature = await Feature.findByIdAndUpdate(
      id,
      { image },
      { new: true } // Return the updated document
    );

    if (!updatedFeature) {
      return res.status(404).json({
        success: false,
        message: "Feature image not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedFeature,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  addFeatureImage,
  getFeatureImages,
  deleteFeatureImage,
  updateFeatureImage,
};
