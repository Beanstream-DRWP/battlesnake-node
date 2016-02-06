'use strict';

var config  = require('../config.json');
var snakes  = require('./ai/snake');

/*
  Games:
  {
    id: {
      snake: {}, // snake object with FSM
      world: {}  // world state
    }
  }
*/



function Service() {
  if (!(this instanceof Service)) {
    return new Service();
  }

  this.games = {};
}

Service.prototype = {

  /*
  Get snake name, color, and head image.

  @param: none

  @return: object
      color - CSS color for your snake's body
      head - Full URL to a 20x20 image for your snake's head
      name - Friendly name of your snake
  */
  Get: function() {
    return {
        color: config.snake.color,
        head: config.snake.head_url, // 20x20 image of snake head
        name: config.snake.name
      };
  },

  /*
  Accept the world state (game data) and return a taunt.

  @param: world object
      game - ID of game being played
      mode - Game mode, either classic or advanced
      turn - Turn number for this move 
      board
        height - Height of game board
        width - Width of game board
      snakes - List of snakes, including their status and position
      food - List of coordinates of available food

  @return: object
      taunt: string
  */
  StartGame: function(world) {

    var mySnake = this._findMySnake(world);

    // cache game based on game ID: world.game. Also create a snake AI
    this.games[world.game] = {
      snake: snakes(mySnake, world),
      world: world
    };
    // creating a new snake will initialize the A* nav grid.
    
    console.log('games: '+this.games);

    // Response data
    var data = {
      taunt: config.snake.taunt.start
    };
    return data;

  },

  // find my snake object in the list of snakes
  _findMySnake: function(world) {
    var s;
    for (s of world.snakes) {
      if (s.id == config.snake.id)
        return s;
    }
  },


  /*
  Accept the world state (game data) and return a taunt.

  @param: world object
      game - ID of game being played
      mode - Game mode, either classic or advanced
      turn - Turn number for this move 
      board
        height - Height of game board
        width - Width of game board
      snakes - List of snakes, including their status and position
      food - List of coordinates of available food

  @return: object
      move: 'up', // one of: ["north", "south", "east", "west"]
      taunt: 'What?!' || config.snake.taunt.move
  */
  Move: function(world) {

    var game = this.games[world.game];
    if (!game) {
      console.log('ERROR finding game!!! '+world.game);
      //console.log('  Available games: ');
      //console.log(this.games);
      return;
    }

    var mySnake = this._findMySnake(world); 
    var resp = game.snake.getMove(mySnake, world);
    
    //console.log('moving '+resp.move+' "'+resp.taunt+'"');

    return resp;
  },

  /*
  Accept the world state (game data) and return a taunt.
  @param: world object
      game - ID of game being played
      mode - Game mode, either classic or advanced
      turn - Turn number for this move 
      board
        height - Height of game board
        width - Width of game board
      snakes - List of snakes, including their status and position
      food - List of coordinates of available food
  @return: nothing
  */
  End: function(world) {
    console.log('GAME END - Removing game '+world.game);
    delete this.games[world.game];
  },

  /*
  How many games are currently running.
  */
  NumberOfGames: function() {
    return Object.keys(this.games).length;
  }

}

module.exports = Service;
module.exports.Service = Service;