var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.redirect("/users");
});

router.get("/task", function(req, res, next) {
  res.redirect("/task");
});
module.exports = router;
