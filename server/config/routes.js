const express = require("express");
const router = express.Router();
const {
  home,
} = require("../src/controller");

router.get("/", home.page);

module.exports = router;
