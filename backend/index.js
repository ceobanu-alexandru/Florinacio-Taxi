const express = require("express");
const cors = require("cors");
const usersRoutes = require("./routes/users.routes");

const app = express();
app.use(cors()); 

app.use(express.json());

app.use("/api/users", usersRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend running" });
});


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});