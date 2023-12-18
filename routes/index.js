var express = require("express");
const userModel = require("./users");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const postModel = require("./posts");

var router = express.Router();

passport.use(new localStrategy(userModel.authenticate()));

// GET base route
router.get("/", isLoggedIn, function (req, res) {
  res.redirect("/profile");
});

// GET to signup page
router.get("/signup", notLoggedIn, function (req, res) {
  res.render("signup", { showNavbar: false });
});

// POST to signup on new signup
router.post("/signup", function (req, res) {
  const { username, email, dob } = req.body;
  let newUser = new userModel({ username, email, dob });
  userModel.register(newUser, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

// GET to login page
router.get("/login", notLoggedIn, function (req, res) {
  res.render("login", { showNavbar: false });
});

// POST to login page on user-login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
  }),
  function (req, res, next) {}
);

// GET profile page
router.get("/profile", isLoggedIn, async function (req, res) {
  const currentUser = await userModel
    .findOne({
      username: req.session.passport.user,
    })
    .populate("posts");
  res.render("profile", { currentUser, showNavbar: true });
});

// GET to logout
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function notLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/profile");
}

router.get("/create-post", isLoggedIn, function (req, res) {
  res.render("create-post", { showNavbar: true });
});

router.post(
  "/create-post",
  isLoggedIn,
  upload.single("imageFile"),
  async function (req, res) {
    const currentUser = await userModel.findOne({
      username: req.session.passport.user,
    });
    const userId = currentUser._id;
    const imageUrl = "/images/uploads/" + req.file.filename;
    const { imageCaption, imageDescription } = req.body;

    const newPost = await postModel.create({
      imageUrl,
      imageCaption,
      imageDescription,
      userId,
    });

    currentUser.posts.push(newPost._id);
    await currentUser.save();

    res.redirect("/profile");
  }
);

router.post(
  "/update-profile-pic",
  isLoggedIn,
  upload.single("profileImage"),
  async function (req, res, next) {
    // res.send("upload done");
    const currentUser = await userModel.findOne({
      username: req.session.passport.user,
    });
    currentUser.profileImage = "/images/uploads/" + req.file.filename;
    await currentUser.save();

    res.redirect("/profile");
  }
);

router.get("/show/my-pins", isLoggedIn, async function (req, res) {
  const currentUser = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  // console.log(currentUser);
  res.render("show", { showNavbar: true, currentUser });
});

router.get(`/show/my-pins/:postId`, isLoggedIn, async function (req, res) {
  const selectedPost = await postModel.findOne({ _id: req.params.postId });
  res.render("view-post", { showNavbar: true, selectedPost });
});

router.get("/delete-post/:postId", isLoggedIn, async function (req, res) {
  const selectedPost = await postModel.findOne({ _id: req.params.postId });
  const currentUser = await userModel.findOne({ _id: selectedPost.userId });
  currentUser.posts.pull(selectedPost._id);
  await currentUser.save();
  await postModel.deleteOne({ _id: req.params.postId });
  res.redirect("/show/my-pins");
});

router.get("/explore", isLoggedIn, async function (req, res) {
  const allPosts = await postModel.find().populate("userId");
  res.render("explore", { showNavbar: true, allPosts });
});

module.exports = router;
