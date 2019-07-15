var express = require("express");
var router = express.Router();
var Task = require("../models/task");
var Member = require("../models/member");
var { check, body, validationResult } = require("express-validator");

router.get("/home", async (req, res) => {
  if (req.session.userID) {
    let task = await Task.find({});
    let member = await Member.find({});
    const sessionMember = member.filter(
      res => res.sessionID == req.session.userID
    );
    const sessionTask = task.filter(res => res.sessionID == req.session.userID);

    if (task) {
      res.render("task/home", { task: sessionTask, member: sessionMember });
    } else {
      return res
        .status(404)
        .send("Some error occurred while retrieving record.");
    }
  } else {
    res.redirect("/");
  }
});

router.post("/home", async (req, res) => {
  if (req.session.userID) {
    if (req.body.status === "0") {
      const data = await Task.findOneAndUpdate(
        { _id: req.body.id, sessionID: req.session.userID },
        { status: "1" },
        { upsert: true, new: true }
      ).exec();
    } else if (req.body.status === "1") {
      const data = await Task.findOneAndUpdate(
        { _id: req.body.id, sessionID: req.session.userID },
        { status: "0" },
        { upsert: true, new: true }
      ).exec();
    }
    let task = await Task.find({});
    let member = await Member.find({});
    const sessionMember = member.filter(
      res => res.sessionID == req.session.userID
    );
    const sessionTask = task.filter(res => res.sessionID == req.session.userID);
    res.render("task/home", { task: sessionTask, member: sessionMember });
  } else {
    res.redirect("/");
  }
});

router.get("/add", function(req, res, next) {
  if (req.session.userID) {
    res.render("task/add", {
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
    check("task", "Please enter task")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    if (req.session.userID) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("task/add", { errors: errors.mapped() });
      } else {
        let task = await Task.findOne({ task: req.body.task });

        if (task) {
          req.flash("error", "This task is already exist!");
          return res.redirect("add");
        } else {
          task = new Task({
            task: req.body.task,
            sessionID: req.session.userID
          });

          await task.save();
          req.flash("success", "Task added Successfully!");
          return res.redirect("/task/home");
        }
      }
    } else {
      res.redirect("/");
    }
  }
);

router.get("/edit/:id", async (req, res) => {
  if (req.session.userID) {
    let task = await Task.findById(req.params.id);

    if (task) {
      res.render("task/edit", {
        title: "Edit",
        success: false,
        errors: req.session.errors,
        task: task
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
    check("task", "Please enter task")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    if (req.session.userID) {
      let task = await Task.findById(req.params.id);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("task/edit", { errors: errors.mapped(), task: task });
      } else {
        const taskData = {
          task: req.body.task
        };

        const data = await Task.findOneAndUpdate(
          { _id: req.params.id, sessionID: req.session.userID },
          taskData,
          {
            new: true
          }
        ).exec();

        if (data) {
          req.flash("success", "Task updated Successfully!");
          res.redirect("/task/home");
        } else {
          req.flash("error", "Failed to process your request ");
          res.redirect("/task/edit" + req.params.id);
        }
      }
    } else {
      res.redirect("/");
    }
  }
);

router.get("/delete/:id", async (req, res) => {
  if (req.session.userID) {
    const data = await Task.findOneAndDelete({
      _id: req.params.id,
      sessionID: req.session.userID
    });

    if (data) {
      req.flash("success", "Task deleted Successfully!");
    } else {
      req.flash("error", "Task is not found");
    }
    res.redirect("/task/home");
  } else {
    res.redirect("/");
  }
});

router.get("/assign/:id", async (req, res) => {
  if (req.session.userID) {
    let task = await Task.findById({
      _id: req.params.id,
      sessionID: req.session.userID
    });

    let member = await Member.find({});
    const resp = member.filter(res => res.sessionID == req.session.userID);

    if (task) {
      res.render("task/assign-task", { member: resp, task: task });
    }
  } else {
    res.redirect("/");
  }
});

router.post("/assign/:id", async (req, res) => {
  if (req.session.userID) {
    let member = await Member.findOne({ firstName: req.body.member });
    let task = await Task.findOne({ _id: req.params.id });

    const data = await Task.findOneAndUpdate(
      { _id: task._id },
      { memberId: member._id },
      { new: true }
    ).exec();
    if (data.memberId) {
      req.flash("success", "Task assign Successfully!");
    } else {
      req.flash("error", "There is some problem in assigning task");
    }

    res.redirect("/task/home");
  } else {
    res.redirect("/");
  }
});

module.exports = router;
