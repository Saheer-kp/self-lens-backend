//****File for handling related to server */
const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGTH REJECTION");
  process.exit(1);
});

// dotenv.config({
//   path: "./config.env",
// });

const app = require("./app");

const db = process.env.DATABASE.replace("<PASSWORD>", process.env.DB_PASSWORD);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log("connection success"));

const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`app is running`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION");

  server.close(() => {
    process.exit(1);
  });
});
