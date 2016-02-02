'use strict';


var config  = require('../../config.json');
var astar   = require('javascript-astar');


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

function Snake(mySnake, world, ignorePredictiveBlocking) {
  if (!(this instanceof Snake)) {
    return new Snake(mySnake, world, ignorePredictiveBlocking);
  }

  this.fsm = require('./fsm.js')();
  this.ignorePredictiveBlocking = ignorePredictiveBlocking; // if true, will ignore config setting for predictive blocking (used for testing)
  this._initialize(mySnake, world);
}

Snake.prototype = {

  /*
  Set up our snake. Give it the idleState state.

  @param:
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
  _initialize: function(mySnake, world) {

    // push the idle state as our starting state
    this.fsm.push(this.idleState);

    // pre-cache a grid here if generation is slow
    // initializeGrid(world.board.width, world.board.height);
  },

  /*
  Plan where we are going to move.
  This calls the FSM to run the head state's logic. That state returns the move direction.

  @return: string
      Direction of your next move, must be one of ["north", "south", "east", "west"]
  */
  getMove: function(mySnake, world) {
    if (!this.fsm.getCurrentState()) {
      this.fsm.push(this.idleState);
    }

    var navMesh = buildNavMesh(mySnake, world);

    var direction = this.fsm.update(mySnake, world);
    var count = config.ai.stateStackDepth; // don't iterate too many times and get stuck forever
    while (!direction && count > 0) {
      count--;
      direction = this.fsm.update(mySnake, world);
    }
    if (!direction) {
      // pick a safe spot, our AI obviously failed

      //TODO
    }
    return direction;
  },

  serialize: function() {
    return {
      fsm: fsm.serialize()
    };
  },


  // ========================================================
  //                        STATES
  // ========================================================
  // States are just functions that can push other functions
  // and pop themselves.
  // ========================================================


  // Nothing to do; the start state.
  // It will find a better state to move to and will return the Move direction
  // from that state
  idleState: function(mySnake, world) {

    if (foodIsOnTheMap(world)) {
      if ( mySnake.health < config.ai.state.idle.needFoodAtHealthLessThan || mySnake.coords.length < config.ai.state.idle.needFoodWhenBodyLessThan ) {
        // need food because hungry or too short
        self.fsm.push(this.findFoodToEatState);

      } else {
        // go guard some food
        self.fsm.push(this.headToGuardFoodState);

      }
    } else {
      // no food on the map
      self.fsm.push(this.moveToSafeSpotState);
    }
  },

  // find a safe position to move to
  moveToSafeSpotState: function(mySnake, world) {
    if ( mySnake.health < config.ai.state.goingToSafeSpot.needFoodAtHealthLessThan ) {
      self.fsm.pop();
      return;
    }

    // find safe spot

    // pathfind
  },

  // Head towards some nearby or safe food to eat.
  // Green snake needs food badly.
  findFoodToEatState: function(mySnake, world) {
    // find food

    // pathfind
  },

  // Head towards some food to circle around
  headToGuardFoodState: function(mySnake, world) {
    if ( mySnake.health < config.ai.state.goingToGuard.needFoodAtHealthLessThan ) {
      self.fsm.pop();
      return;
    }

    // if near food, start guarding
      // self.fsm.replaceCurrentState(guardFoodState);
    // else {
      // find safe spot

      // pathfind
  },

  // We are near some food, let's circle around it and hope other snakes run into us
  guardFoodState: function(mySnake, world) {
    if ( mySnake.health < config.ai.state.guarding.needFoodAtHealthLessThan ) {
      // need food because hungry or too short
      self.fsm.push(this.findFoodToEatState);
      return;
    }

    // find food corner

    // pathfind
  },



// -------------------------------------------------------------
//              HELPER FUNCTIONS
// -------------------------------------------------------------



  foodIsOnTheMap: function(world) {
    return world.food.length > 0;
  },

  /* 
  Build the nav grid (board) that will be turned into the nav mesh.
  The board is built into a 2d array with coordinates as [x,y] and the top
  left corner being [0,0] and the bottom right being [width-1,height-1].

  It will save the board object on the snake as snake.board.
  */
  buildBoard: function(world) {
    this.board = Board(world);
    
    this.blockBoardWithSnakes(world);
    if (config.ai.usePredictiveBlocking && !this.ignorePredictiveBlocking) {
      this.applyPredictiveBlocking(world);
    }
    this.setBoardThreatAreas(world);
    this.setBoardCautionAreas(world);

    return this.board;
  },

  buildNavMesh: function(mySnake, world) {
    var graph = astar.Graph();
    return graph
  },

  // uses this.board and blocks all spots with a snake body on them.
  blockBoardWithSnakes: function(world) {
    var s;
    for (s of world.snakes) {
      var coord;
      for (coord of s.coords) {
        this.board.block(coord[0], coord[1]);
      }
    }
  },

  /*
  This will test the distancefrom the head of our snake to the
  other blocked squares. If those squares will be gone by the time
  we reach them, then they are removed. It will never remove the heads
  of the enemy snakes.
  This will help with producing more direct routes.
  The distance calculation it uses is the Manhattan Heuristic.
  */
  applyPredictiveBlocking: function(world) {
    var mySnake;
    for (s of world.snakes) {
      if (s.name == config.snake.name) {
        mySnake = s;
      }
    }
    if (!mySnake) {
      console.log("ERROR: could not find our snake! "+world.snakes);
      return;
    }

    var head = mySnake.coords[0];
    var s;
    for (s of world.snakes) {
      if (s.name != config.snake.name) { // for enemy snakes only
        var bodyLen = s.coords.length;
        for (var i=1; i < s.coords.length; i++) { // skip the head, idx 0
          // for each section of the body (besides the head)
          if ( (bodyLen-i) < this.d(s.coords[i], head) ) {
            // body will have moved by the time we get there, so remove it from the grid
            this.board.open(s.coords[i][0], s.coords[i][1]);
            console.log("removed predictive spot: "+s.coords[i]);
          }
        }
      }
    }
  },

  // the manhattan distance between the two coordinates
  d: function(c1, c2) {
    return Math.abs(c2[0]-c1[0]) + Math.abs(c2[1]-c1[1]);
  },

  // Uses this.board and sets the threat areas around the enemy snake heads.
  // 1 move away
  setBoardThreatAreas: function(world) {
    var s;
    for (s of world.snakes) {
      if (s.name != config.snake.name) { // not our snake
        var x = s.coords[0][0];
        var y = s.coords[0][1];
        // 1 move away from all enemy snake heads
        this.board.markHeigherWeight(x, y-1, config.ai.gridWeights.threat) // north
        this.board.markHeigherWeight(x+1, y, config.ai.gridWeights.threat) // east
        this.board.markHeigherWeight(x, y+1, config.ai.gridWeights.threat) // south
        this.board.markHeigherWeight(x-1, y, config.ai.gridWeights.threat) // west
      }
    }
  },

  // Uses this.board and sets the caution areas around the enemy snake heads.
  // 2 moves away
  setBoardCautionAreas: function(world) {
    var s;
    for (s of world.snakes) {
      if (s.name != config.snake.name) { // not our snake
        var x = s.coords[0][0];
        var y = s.coords[0][1];
        // 2 moves away from all enemy snake heads
        this.board.markHeigherWeight(x, y-2, config.ai.gridWeights.caution) // north
        this.board.markHeigherWeight(x+2, y, config.ai.gridWeights.caution) // east
        this.board.markHeigherWeight(x, y+2, config.ai.gridWeights.caution) // south
        this.board.markHeigherWeight(x-2, y, config.ai.gridWeights.caution) // west

        this.board.markHeigherWeight(x+1, y-1, config.ai.gridWeights.caution) // north-east
        this.board.markHeigherWeight(x+1, y+1, config.ai.gridWeights.caution) // south-east
        this.board.markHeigherWeight(x-1, y+1, config.ai.gridWeights.caution) // south-west
        this.board.markHeigherWeight(x-1, y-1, config.ai.gridWeights.caution) // north-west
      }
    }
  }

}

/*
The board used for the nav mesh.
The board is built into a 2d array with coordinates as [x,y], the 
top-left corner being [0,0] and the bottom right being [width-1,height-1].

Use the functions on this object to access the values at the coordinates. 
If you access them directly you will end up with flipped x,y values.
*/
function Board(world) {
  if (!(this instanceof Board)) {
    return new Board(world);
  }

  this.width = world.board.width;
  this.height = world.board.height;
  this.mySnake = this.findMySnake(world);
  this.grid = this.buildGrid(world); // 2d int array
}

Board.prototype = {
  
  prettyPrint: function() {
    var headCoord = this.mySnake.coords[0];

    for (var y=0; y<this.height; y++) {
      var row = "";
      for (var x=0; x<this.width; x++) {
        if (x == headCoord[0] && y == headCoord[1])
          row += "#"+" "; // print a noticeable snake head for us
        else
          row += this.get(x, y)+" ";
      }
      console.log("        "+row);
    }
  },

  /* 
  Build the nav grid that will be turned into the nav mesh.

  The grid is initialized to all 1's in every spot, meaning they are empty.
  0's will indicate blocked slots.
  */
  buildGrid: function() {
    var grid = [];
    for (var y=0; y < this.height; y++) {
      var row = [];
      for (var x=0; x < this.width; x++) {
        row.push(1);
      }
      grid.push(row);
    }
    return grid;
  },

  get: function(x, y) {
    return this.grid[y][x];
  },

  block: function(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height)
      this.grid[y][x] = 0;
  },

  threat: function(x, y) {
    if (x >= 0 && x <this. width && y >= 0 && y < this.height)
      this.grid[y][x] = 3;
  },

  cautious: function(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height)
      this.grid[y][x] = 2;
  },

  open: function(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height)
      this.grid[y][x] = 1;
  },

  /* Mark the coordinate with the supplied weight only if this weight is higher
  than what is already there. It will not mark a blocked spot.
  Requires the board object to get the width and height
  */
  markHeigherWeight: function(x, y, weight) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      var w = this.get(x,y);
      if (w != 0 && w < weight)
        this.grid[y][x] = weight;
    }
  },

  findMySnake: function(world) {
    var s;
    for (s of world.snakes) {
      if (s.name == config.snake.name) {
        return s;
      }
    }
  },

}

module.exports = Snake;
module.exports.Snake = Snake;
module.exports.Snake.Board = Board;