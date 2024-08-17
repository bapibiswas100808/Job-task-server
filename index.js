const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mfs-project-a4f60.web.app",
    ],
  })
);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5e8b5ac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    // await client.connect();
    const ProductCollections = client.db("JobTaskDB").collection("allProducts");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Get All Product with search
    app.get("/allProducts", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const searchTerm = req.query.search || "";
      const brand = req.query.brand || "";
      const category = req.query.category || "";
      const priceRange = req.query.priceRange || "";
      const priceSortOrder = req.query.priceSortOrder || "";
      const dateSortOrder = req.query.dateSortOrder || "";

      const skip = (page - 1) * limit;
      let filter = {};
      let sort = {};

      // Search by product name
      if (searchTerm) {
        filter.ProductName = { $regex: searchTerm, $options: "i" };
      }

      // Search by Brand
      if (brand) {
        filter.BrandName = brand;
      }

      // Searchby Category
      if (category) {
        filter.Category = category;
      }

      // Sort by price range
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split("-");
        filter.Price = {
          $gte: parseFloat(minPrice),
          $lte: parseFloat(maxPrice),
        };
      }

      // Sort by Ascending or descending Price
      if (priceSortOrder) {
        sort.Price = priceSortOrder === "asc" ? 1 : -1;
      }

      // Sort By Time and Date of product update
      if (dateSortOrder) {
        sort.ProductCreationDate = dateSortOrder === "asc" ? 1 : -1;
      }

      // Get all products
      const allProducts = await ProductCollections.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      // Count total products
      const totalProducts = await ProductCollections.countDocuments(filter);

      res.send({
        data: allProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
      });
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("project is running");
});

app.listen(port, () => {
  console.log(`project is running at ${port}`);
});
