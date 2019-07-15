var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Member = require("../models/member");
var bcrypt = require("bcryptjs");
var Task = require("../models/task");
var { check, body, validationResult } = require("express-validator");

router.get("/home", async (req, res) => {
  if (req.session.userID) {
    let member = await Member.find({});
    const resp = member.filter(res => res.sessionID == req.session.userID);
    if (member) {
      res.render("user/home", {
        member: resp
      });
    } else {
      return res
        .status(404)
        .send("Some error occurred while retrieving record.");
    }
  } else {
    res.redirect("/");
  }
});

router.get("/", function(req, res, next) {
  res.render("login", {
    title: "Login",
    success: false,
    errors: req.session.errors
  });
  req.session.errors = null;
});

router.get("/register", function(req, res) {
  res.render("register", {
    title: "Register",
    success: false,
    errors: req.session.errors
  });
  req.session.errors = null;
});

router.get("/profile", function(req, res) {
  if (req.session.userID) {
    res.render("change-password", {
      title: "Profile",
      success: false,
      errors: req.session.errors
    });
    req.session.errors = null;
  } else {
    res.redirect("/");
  }
});

router.post(
  "/profile",
  [
    check("password", "Please enter valid password").isLength({ min: 4 }),
    check("new_password", "Please enter valid New password").isLength({
      min: 4
    }),
    check(
      "confirm_new_password",
      "Please enter valid Confirm New password"
    ).isLength({
      min: 4
    })
  ],
  async (req, res) => {
    if (req.session.userID) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("change-password", { errors: errors.mapped() });
      } else {
        let user = await User.findOne({ _id: req.session.userID });
        let new_password = bcrypt.hashSync(req.body.new_password, 10);
        const result = await bcrypt.compare(req.body.password, user.password);

        if (result === true) {
          if (req.body.new_password === req.body.confirm_new_password) {
            await User.findOneAndUpdate(
              { _id: user._id },
              { password: new_password },
              {
                new: true
              }
            ).exec();
          }
          req.flash("success", "Your password changed successfully!");
        } else {
          req.flash("error", "Incorrect password");
        }
        return res.redirect("/users/profile");
      }
    } else {
      res.redirect("/");
    }
  }
);

router.post(
  "/sign_in",
  [
    check("email", "Please enter valid email address").isEmail(),
    check("password", "Please enter valid password").isLength({ min: 4 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("login", { errors: errors.mapped() });
    } else {
      let user = await User.findOne({ email: req.body.email });

      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        req.session.userID = user._id;
        return res.redirect("/users/home");
      } else {
        req.flash("error", "Incorrect email or password.");
        return res.redirect("/");
      }
    }
  }
);

router.post(
  "/sign_up",
  [
    check("firstname", "Please enter firstname")
      .not()
      .isEmpty(),
    check("lastname", "Please enter lastname")
      .not()
      .isEmpty(),
    check("email", "Please enter valid email address").isEmail(),
    check("password", "Please enter valid password").isLength({ min: 4 }),
    check("confirm_password", "Passwords do not match").custom(
      (value, { req, loc, path }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords don't match");
        } else {
          return value;
        }
      }
    )
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("register", { errors: errors.mapped() });
    } else {
      let user = await User.findOne({ email: req.body.email });

      if (user) {
        req.flash("error", "This user already exist!");
        return res.redirect("register");
      } else {
        user = new User({
          email: req.body.email,
          firstName: req.body.firstname,
          lastName: req.body.lastname,
          password: req.body.password
        });

        if (req.body.password) {
          user.password = bcrypt.hashSync(req.body.password, 10);
        }

        await user.save();
        req.flash("success", "You are successfully register!");
        return res.redirect("/");
      }
    }
  }
);

router.get("/add", function(req, res, next) {
  if (req.session.userID) {
    res.render("user/add", {
      title: "Add",
      success: false,
      errors: req.session.errors
    });
    req.session.errors = null;
  } else {
    res.redirect("/");
  }
});

router.post(
  "/add",
  [
    check("firstname", "Please enter firstname")
      .not()
      .isEmpty(),
    check("lastname", "Please enter lastname")
      .not()
      .isEmpty(),
    check("email", "Please enter valid email address").isEmail()
  ],
  async (req, res) => {
    if (req.session.userID) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("user/add", { errors: errors.mapped() });
      } else {
        let member = await Member.findOne({ email: req.body.email });
        if (member) {
          req.flash("error", "This member already exist!");
          return res.redirect("add");
        } else {
          member = new Member({
            email: req.body.email,
            firstName: req.body.firstname,
            lastName: req.body.lastname,
            sessionID: req.session.userID
          });

          await member.save();
          req.flash("success", "Member added Successfully!");
          return res.redirect("/users/home");
        }
      }
    } else {
      res.redirect("/");
    }
  }
);

router.get("/edit/:id", async (req, res) => {
  if (req.session.userID) {
    let member = await Member.findById(req.params.id);

    if (member) {
      res.render("user/edit", {
        title: "Edit",
        success: false,
        errors: req.session.errors,
        member: member
      });
      req.session.errors = null;
    }
  } else {
    res.redirect("/");
  }
});

router.post(
  "/edit/:id",
  [
    check("firstname", "Please enter firstname")
      .not()
      .isEmpty(),
    check("lastname", "Please enter lastname")
      .not()
      .isEmpty(),
    check("email", "Please enter valid email address").isEmail()
  ],
  async (req, res) => {
    if (req.session.userID) {
      let member = await Member.findById(req.params.id);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("user/edit", { errors: errors.mapped(), member: member });
      } else {
        const memberData = {
          firstName: req.body.firstname,
          lastName: req.body.lastname,
          email: req.body.email
        };
        const data = await Member.findOneAndUpdate(
          { _id: req.params.id, sessionID: req.session.userID },
          memberData,
          {
            new: true
          }
        ).exec();

        if (data) {
          req.flash("success", "Member updated Successfully!");
          res.redirect("/users/home");
        } else {
          req.flash("error", "Failed to process your request ");
          res.redirect("/user/edit" + req.params.id);
        }
      }
    } else {
      res.redirect("/");
    }
  }
);

router.get("/delete/:id", async (req, res) => {
  if (req.session.userID) {
    const data = await Member.findOneAndDelete({
      _id: req.params.id,
      sessionID: req.session.userID
    });

    if (data) {
      req.flash("success", "Member deleted Successfully!");
    } else {
      req.flash("error", "Member is not found");
    }
    return res.redirect("/users/home");
  } else {
    res.redirect("/");
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();

  if (!req.session) {
    return res.redirect("/");
  }
});

module.exports = router;
