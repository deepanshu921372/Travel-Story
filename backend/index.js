require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const upload = require("./multer");
const fs = require("fs");
const path = require("path");

const { authenticateToken } = require("./utilities");

const User = require("./models/user.model");
const TravelStory = require("./models/travelStory.model");
mongoose.connect(config.connectionString);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Create Account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }
  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    fullName,
    email,
    password: hashedPassword,
  });

  await user.save();

  const accesstoken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.status(201).json({
    error: false,
    user: {
      fullName: user.fullName,
      email: user.email,
    },
    message: "Account created successfully",
    accesstoken,
  });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(400).json({ error: true, message: "User not found" });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    return res.status(400).json({ error: true, message: "Invalid password" });
  }

  const accesstoken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.status(200).json({
    error: false,
    message: "Login successful",
    user: {
      fullName: user.fullName,
      email: user.email,
    },
    accesstoken,
  });
});

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: isUser,
    message: "",
  });
});

// Route to handle image upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: true, message: "No image provided" });
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: true,
        message:
          "Invalid file type. Only JPEG, PNG, GIF and WEBP images are allowed",
      });
    }

    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
    return res.status(200).json({ imageUrl });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      error: true,
      message: "Error uploading image: " + error.message,
    });
  }
});

// Delete image from uploads folder
app.delete("/delete-image", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res
      .status(400)
      .json({ error: true, message: "imgUrl parameter is required" });
  }

  try {
    const filename = path.basename(imageUrl);

    const filePath = path.join(__dirname, "uploads", filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ message: "Image deleted successfully" });
    } else {
      return res.status(404).json({ error: true, message: "Image not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Serve static files from the uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      visitedDate: parsedVisitedDate,
    });
    await travelStory.save();
    return res.status(201).json({
      error: false,
      message: "Travel story added successfully",
      travelStory: travelStory,
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
});

// Get All Travel Stories
app.get("/get-all-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({
      isFavourite: -1,
    });
    return res.status(200).json({ stories: travelStories });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  if (!title || !story || !visitedLocation || !visitedDate) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }

  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    const placeHolderImageUrl = `http://localhost:8000/assets/placeholder.png`;

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocation = visitedLocation;
    travelStory.imageUrl = imageUrl || placeHolderImageUrl;
    travelStory.visitedDate = parsedVisitedDate;
    await travelStory.save();
    return res.status(200).json({
      error: false,
      message: "Travel story updated successfully",
      travelStory: travelStory,
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Delete Travel Story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: true, message: "Invalid story ID" });
    }

    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    // Delete the image file if it exists and isn't the placeholder
    if (
      travelStory.imageUrl &&
      !travelStory.imageUrl.includes("placeholder.png")
    ) {
      const filename = path.basename(travelStory.imageUrl);
      const filePath = path.join(__dirname, "uploads", filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the story from database
    await TravelStory.deleteOne({ _id: id, userId: userId });

    return res.status(200).json({
      error: false,
      message: "Travel story deleted successfully",
    });
  } catch (error) {
    console.error("Delete story error:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to delete travel story",
    });
  }
});

// Update isFavourite
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isFavourite } = req.body;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }
    travelStory.isFavourite = isFavourite;
    await travelStory.save();
    return res.status(200).json({
      story: travelStory,
      message: "Travel story updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Search Travel Stories
app.get("/search", authenticateToken, async (req, res) => {
  const { query } = req.query;
  const { userId } = req.user;

  if (!query) {
    return res
      .status(404)
      .json({ error: true, message: "Query parameter is required" });
  }

  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavourite: -1 });
    return res.status(200).json({ stories: searchResults });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Filter Travel Stories by date range
app.get("/filter-stories/filter", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate } = req.query;

  try {
    const start = new Date(parseInt(startDate));
    const end = new Date(parseInt(endDate));

    const filteredStories = await TravelStory.find({
      userId: userId,
      visitedDate: { $gte: start, $lte: end },
    }).sort({ isFavourite: -1 });
    return res.status(200).json({ stories: filteredStories });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

app.listen(process.env.PORT || 8000);
module.exports = app;
