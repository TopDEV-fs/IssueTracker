const express = require("express");
const { authMiddleware } = require("../../controllers/auth/auth-controller");
const { getLoggedInUsers } = require("../../controllers/admin/getUsers");

const getUserRouter = express.Router();

getUserRouter.get("/logged-in-users", authMiddleware, getLoggedInUsers);

module.exports = getUserRouter;
