const express = require("express");
const db = require("./db");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// server static content
// npm run build
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "../client/build")));
  console.log("production mode");
}

const PORT = process.env.PORT || 3001;

// ~~~~~~~~~~~~~~~~ POST ROUTES ~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Get all blog posts
app.get("/posts", async (req, res) => {
  try {
    const blogPosts = await db.query("SELECT * FROM blog_post");
    res.status(200).json({
      blogPosts: blogPosts.rows.length,
      data: {
        posts: blogPosts.rows,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// Get a single blog post
app.get("/posts/:id", async (req, res) => {
  const {id} = req.params;
  const {rows} = await db.query("SELECT * FROM blog_post WHERE id = $1", [id]);
  res.send(rows[0]);
});

// Create blog post
app.post("/posts/create", async (req, res) => {
  console.log(req.body);

  try {
    const {rows} = await db.query(
      "INSERT INTO blog_post (user_id, blog_image, blog_title, post_author, post_content) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        req.body.user_id,
        req.body.blog_image,
        req.body.blog_title,
        req.body.post_author,
        req.body.post_content,
      ]
    );
    res.status(200).json({
      status: "Sucessfully Added to Database",
      blogPosts: rows.length,
      data: {
        posts: rows,
      },
    });
    console.log(rows);
  } catch (err) {
    console.log(err);
  }
});

// Update post
app.put("/posts/:id", async (req, res) => {
  try {
    const {rows} = await db.query(
      "UPDATE blog_post SET user_id = $1, blog_image = $2, blog_title = $3, post_author = $4, post_content = $5 WHERE id = $6 RETURNING *",
      [
        req.body.user_id,
        req.body.blog_image,
        req.body.blog_title,
        req.body.post_author,
        req.body.post_content,
        req.params.id,
      ]
    );
    res.status(200).json({
      status: "Successfully updated post",
    });
  } catch (err) {
    console.log(err);
  }
});

// Delete blog post
app.delete("/posts/:id", async (req, res) => {
  try {
    const {rows} = await db.query("DELETE FROM blog_post WHERE id = $1", [
      req.params.id,
    ]);
    res.status(204).json({
      status: "Successfully deleted post",
    });
  } catch (err) {
    console.log(err);
  }
});

// ~~~~~~~~~~~~~~~~~ USER ROUTES ~~~~~~~~~~~~~~~~~~~~

app.get("/users", async (req, res) => {
  const results = await db.query("SELECT * FROM users");
  res.status(200).json({
    results: results.rows.length,
    data: {
      users: results.rows,
    },
  });
});
// Create User register
app.post("/posts/register", async (req, res) => {
  try {
    const {first_name, last_name, email, password} = req.body;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = await bcrypt.hashSync(password, salt);

    let results = await db.query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
      [first_name, last_name, email, passwordHash]
    );
    res.status(200).json({
      status: "Sucessfully Added to Database",
    });
  } catch (err) {
    console.log(err);
  }
});

// login
app.post("/posts/login", async (req, res) => {
  const {email, password} = req.body;
  console.log(email);

  let validUser = await db.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  let hasedPassword = validUser.rows[0].password;
  let auth = bcrypt.compareSync(password, hasedPassword);

  if (email) return res.send(validUser).json();
  else {
    res.status(403).send({
      message: "Wrong user",
    });
  }
});

// For Deployment
// To make sure any endpoints that weren't specified in app it will reroute to home
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// const {PORT} = process.env;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
