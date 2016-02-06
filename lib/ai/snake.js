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

  this.mySnake = mySnake;
  this.world = world;
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

  @return: object {
      move: Direction of your next move, must be one of ["north", "south", "east", "west"]
      taunt: string
  */
  getMove: function(mySnake, world) {
    if (!this.fsm.getCurrentState()) {
      this.fsm.push(this.idleState);
    }

    this.mySnake = mySnake; // cache new copies of the state
    this.world = world;

    var navMesh = buildNavMesh(mySnake, world);

    var resp = this.fsm.update(mySnake, world);
    var count = config.ai.stateStackDepth; // don't iterate too many times and get stuck forever
    // it is normal for a state to return Undefined. This happens when it pops itself or pushes a new state.
    while (!resp && count > 0) {
      count--;
      resp = this.fsm.update(mySnake, world);
    }
    if (!resp) {
      // pick a safe spot, our AI obviously failed
      var dir = this.adjustTargetLocIfBlocked(this.head());
      return { 
        move: this.getDirString(dir),
        taunt: 'Bieber Rulz!'
       };

    }
    return resp;
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
        return;

      } else {
        // head to safe spot
        self.fsm.push(this.moveToSafeSpotState);
        return;
      }
    } else {
      // no food on the map
      self.fsm.push(this.moveToSafeSpotState);
      return;
    }
  },

  // Find a safe position to move to.
  // Returns undefined when it pops itself
  moveToSafeSpotState: function(mySnake, world) {
    if ( mySnake.health < config.ai.state.goingToSafeSpot.needFoodAtHealthLessThan ) {
      self.fsm.pop();
      return;
    }
    
    // first find what direction we should continue moving in, so we don't just wiggle in one spot
    var dir = this.getWiseDirection();

    // Set the target location as the far end of the board from where
    // we are, in the direction we are now headed
    var targetLoc = this.findTargetInDistance(dir);
    
    // spiral position search that grabs the first available spot
    targetLoc = this.adjustTargetLocIfBlocked(targetLoc);

    // pathfind
    var path = this.pathfind([this.head()[0],this.head()[1]], [targetLoc[0],targetLoc[1]]);

    if (path && path.length > 0) {
      // return the path's direction (this is the ideal direction)
      return this.getDirString( this.getDirToLoc(path[0]) );
    }
    else 
      return this.getDirString(dir);
  },


  // Head towards some nearby or safe food to eat.
  // Green snake needs food badly.
  findFoodToEatState: function(mySnake, world) {
    // find food

    // pathfind
  },

  // Head towards some food to circle around
  /*headToGuardFoodState: function(mySnake, world) {
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
  },*/



// -------------------------------------------------------------
//              HELPER FUNCTIONS
// -------------------------------------------------------------

  // Return the coordinates of the head of our snake
  head: function() {
    return this.mySnake.coords[0];
  },

  // Is there food on the map?
  foodIsOnTheMap: function(world) {
    return world.food.length > 0;
  },

  // call this before pathfinding
  unblockMyHeadLocation: function() {
    this.board.open(this.head()[0], this.head()[1]);
  },

  /*
  Parameters start and end are integer X,Y coordinates in an array: [x,y].
  Returns a path from astar library.
  */
  pathfind: function(start, end) {
    var graph = new astar.Graph(this.board.grid);
    var path = astar.astar.search(
      graph, 
      graph.grid[start[1]][start[0]], // we flip the XY coords
      graph.grid[end[1]][end[0]]
    );
    // flip x,y coords on returned path
    var flipped = [];
    for (var i=0; i<path.length; i++) {
      flipped.push( [ path[i].y , path[i].x ]);
    }
    return flipped;
  },

  // convert the int direction into string direction
  getDirString: function(dir) {
    if (dir == 0)
      return "north";
    else if (dir == 1)
      return "east";
    else if (dir == 2)
      return "south";
    else
      return "west";
  },

  // get the direction from the snake head to the supplied coordinate
  getDirToLoc: function(coord) {
    if (this.head()[0] == coord[0]) { // same X, so either North or South
      if (this.head()[1] > coord[1])
        return 0; // north
      else
        return 2; // south
    } else { // different X, so either East or West
      if (this.head()[0] < coord[0])
        return 1; // east
      else
        return 3; // west
    }
  },

  nearTop: function() {
    return this.head()[1] < config.ai.wallBuffer;
  },

  nearLeft: function() {
    return this.head()[0] < config.ai.wallBuffer;
  },

  nearRight: function() {
    return this.head()[0] >= this.board.width - config.ai.wallBuffer;
  },

  nearBottom: function() {
    return this.head()[1] >= this.board.height - config.ai.wallBuffer;
  },

  /*
  Get a wise direction that we should head towards.
  Used with the moveToSafeSpotState state.
  */
  getWiseDirection: function() {
    var head = this.mySnake.coords[0];
    var dir = Math.floor(Math.random()*4); // 0 (north), 1(east), 2(south), 3(west)
    
    if (this.mySnake.coords.length > 1) {
      var b = this.mySnake.coords[1]; // 2nd body part
      if (b[0] < head[0]) 
        dir = 1; // moving east
      else if (b[0] > head[0]) 
        dir = 3; // moving west
      else if (b[1] > head[1]) 
        dir = 0; // moving north
      else
        dir = 2; // moving south
    }

    // We have what direction we are headed, lets make sure it is not close to a wall
    // and adjust if necessary
    if (dir == 0) { // north
      if (this.nearTop()) { // near top                   N   location
        // move left or right instead
        if (this.nearLeft()) // wall to the west          NW  location
          dir = 1; // move east instead
        else //                                           NE  location
          dir = 3; // move west instead
      }
    } else if (dir == 1) { // east                        
      if (this.nearRight()) { // near right               E   location
        // move up or down instead
        if (this.nearTop()) // near top                   NE  location
          dir = 2; // move south instead
        else //                                           SE  location
          dir = 0; // move north instead
      }
    } else if (dir == 2) { // south                       
      if (this.nearBottom()) { // near bottom             S   location
        // move left or right instead
        if (this.nearLeft()) // wall to the west          SW  location
          dir = 1; // move east instead
        else //                                           SE  location
          dir = 3; // move west instead
      }
    } else if (dir == 3) { // west
      if (this.nearLeft()) { // near left                 W   location
        // move up or down instead
        if (this.nearBottom()) //                         SW  location
          dir = 0; // move north instead
        else  //                                          NW  location
          dir = 2; // move south instead
      }
    }

    return dir;
  },

  /*
  Given a cardinal direction, find a point off in the distance that
  we can head towards. Keep the point inside the box and make sure it isn't
  blocked.
  */
  findTargetInDistance: function(dir) {
    var targetLoc;
    if (dir == 0) { // north
      targetLoc = [this.head()[0], config.ai.wallBuffer]; // near the north wall
    }
    else if (dir == 1) { // east
      targetLoc = [this.board.width-1 - config.ai.wallBuffer, this.head()[1]]; // near the east wall
    }
    else if (dir == 2) { // south
      targetLoc = [this.head()[0], this.board.height-1 - config.ai.wallBuffer]; // near the south wall
    }
    else if (dir == 3) { // west
      targetLoc = [config.ai.wallBuffer, this.head()[1]]; // near the west wall
    } else {
      // random (probably never reaches here)
      targetLoc = [Math.floor(Math.random()*this.board.width), Math.floor(Math.random()*this.board.height)];
    }
    return targetLoc;
  },

  /*
  Spiral around until we find an open space.
  */
  adjustTargetLocIfBlocked: function(targetLoc, r) {
    if (this.board.isBlocked(targetLoc[0], targetLoc[1])) {
      if (!r) 
        r = 1; // radius
      if (r > 4) {
        console.log('Failed to find a spot in adjustTargetLocIfBlocked') ;
        return targetLoc; // failed to find a spot!
      }

      for (var x=targetLoc[0]-r; x<=targetLoc[0]+r; x++) { // top row
        var nl = [x, targetLoc[1]-r]; // -Y
        //console.log(nl);
        if (!this.board.isBlocked(nl[0], nl[1]))
          return nl;
      }
      for (var y=targetLoc[1]-r; y<=targetLoc[1]+r; y++) { // right column
        var nl = [targetLoc[0]+r, y]; // +X
        //console.log(nl);
        if (!this.board.isBlocked(nl[0], nl[1]))
          return nl;
      }
      for (var x=targetLoc[0]+r; x>=targetLoc[0]-r; x--) { // bottom row
        var nl = [x, targetLoc[1]+r]; // +Y
        //console.log(nl);
        if (!this.board.isBlocked(nl[0], nl[1]))
          return nl;
      }
      for (var y=targetLoc[1]+r; y>=targetLoc[1]-r; y--) { // left column
        var nl = [targetLoc[0]-r, y]; // -X
        //console.log(nl);
        if (!this.board.isBlocked(nl[0], nl[1]))
          return nl;
      }

      // recursively call
      return this.adjustTargetLocIfBlocked(targetLoc, r+1); // increment radius

    } else
      return targetLoc;
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
    /*var mySnake;
    for (s of world.snakes) {
      if (s.id == config.snake.id) {
        mySnake = s;
      }
    }
    if (!mySnake) {
      console.log("ERROR: could not find our snake! "+world.snakes);
      return;
    }*/

    var head = this.head(world);//mySnake.coords[0];
    var s;
    for (s of world.snakes) {
      if (s.id != config.snake.id) { // for enemy snakes only
        var bodyLen = s.coords.length;
        for (var i=1; i < s.coords.length; i++) { // skip the head, idx 0
          // for each section of the body (besides the head)
          if ( (bodyLen-i) < this.d(s.coords[i], head) ) {
            // body will have moved by the time we get there, so remove it from the grid
            this.board.open(s.coords[i][0], s.coords[i][1]);
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
      if (s.id != config.snake.id) { // not our snake
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
      if (s.id != config.snake.id) { // not our snake
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
          row += "*"+" "; // print a noticeable snake head for us
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
    if (x >= 0 && x <this.width && y >= 0 && y < this.height)
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

  isBlocked: function(x, y) {
    if (x >= 0 && x <this.width && y >= 0 && y < this.height) {
      return this.get(x,y) == 0;
    } else
      return true; // outside grid
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
      if (s.id == config.snake.id) {
        return s;
      }
    }
  },

}

module.exports = Snake;
module.exports.Snake = Snake;
module.exports.Snake.Board = Board;