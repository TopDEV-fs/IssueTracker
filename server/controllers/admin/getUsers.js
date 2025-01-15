const User = require("../../models/User");

// GetLoggedInUsers
const getLoggedInUsers = async (req, res) => {
  try {
    // Fetch users who are authenticated based on your session or token logic
    const loggedInUsers = await User.find({
      isAuthenticated: true,
      role: "user",
    });

    res.status(200).json({
      success: true,
      users: loggedInUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching logged-in users",
      error: error.message,
    });
  }
};

module.exports = { getLoggedInUsers };
