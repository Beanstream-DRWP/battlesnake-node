'use strict';

/*
Snake Data:
    name - Snake Name
    status - Status, either 'alive' or 'dead'
    message - Friendly message describing this snakes last move
    taunt - Snake's latest taunt
    age - How many turns this snake has survived
    health - Current snake health (0 - 100)
    coords - List of [x, y] coordinates describing snake position, ordered from head to tail
    kills - Number of snake deaths this snake is responsible for
    food - Number of food eaten by this snake
*/

function Snake(world) {
  if (!(this instanceof Snake)) {
    return new Snake();
  }

  this.fsm = require('./fsm.js')();
  this.initialize(world);
}

Snake.prototype = {

  /*
  GameInfo comes in this format:
    game - ID of game being played
    mode - Game mode, either classic or advanced
    turn - Turn number for this move 
    board
      height - Height of game board
      width - Width of game board
    snakes - List of snakes, including their status and position
    food - List of coordinates of available food
  */
  initialize: function(world) {
    this.worldState = world;

  },

  getState: function() {
    /*
    var data = {
        name: config.snake.name,
        color: config.snake.color,
        head_url: config.snake.head_url,
        taunt: config.snake.taunt.state,
        state: "alive",
        coords: [[0, 0], [0, 1], [0, 2], [1, 2]],
        score: 4
      };
    */
  },

  /*
  Update snake state from the world state. Length etc.
  This is called from the /move endpoint before the actual getMove()
  function is called.
  */
  updateFromWorld: function(world) {

  },

  /*
  Plan where we are going to move.
  This calls the FSM to run the head state's logic. That state returns the move direction.
  */
  getMove: function(world) {
    return this.fsm.update(world);
  },

  serialize: function() {
    return {

    };
  }
}

module.exports = Snake;
module.exports.Snake = Snake;