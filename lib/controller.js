'use strict';

var config  = require('../config.json');
var express = require('express');
var router  = express.Router();
var service = require('./service')();


// GET /
// Get the meta info for the snake
router.get(config.routes.state, function (req, res) {

  var response = service.Get();

  return res.json(response);
});

// POST /start
// Start
router.post(config.routes.start, function (req, res) {
  
  console.log('Starting Game:', req.body.game);

  var response;

  try {
    response = service.StartGame(req.body);
  } catch (ex) {
    console.log(ex);
    console.trace(ex);
    throw ex;
  }
  return res.json(response);
});

// POST /move
// Move
router.post(config.routes.move, function (req, res) {
  
  //console.log(req.body);
  var response;
  try {
    response = service.Move(req.body);
  } catch (ex) {
    console.log(ex);
    throw ex;
  }
  return res.json(response);
});

// POST /end
// End the session
router.post(config.routes.end, function (req, res) {
  
  service.End(req.body);

  // We don't need a response so just send back a 200
  res.status(200);
  res.end();
  return;
});


module.exports = router;
