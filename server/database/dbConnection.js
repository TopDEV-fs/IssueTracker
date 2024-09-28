const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose
    .connect(
      "mongodb+srv://safwanjarir07:sagor7531@cluster8.vyepr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster8"
    )
    .then(() => {
      console.log("Connected to database!");
    })
    .catch((err) => {
      console.log("Some error occured while connecting to database:", err);
    });
};

module.exports = dbConnection;
