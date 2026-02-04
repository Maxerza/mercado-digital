const path = require("path");
const express = require("express");
const { init } = require("./database");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const purchaseRoutes = require("./routes/purchase");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = 3000;


app.use(express.json({ limit: "12mb" }));


app.use(express.static(path.join(__dirname, "..", "frontend")));


app.use("/api", authRoutes);
app.use("/api", productRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor listo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error iniciando la base de datos", err);
    process.exit(1);
  });

