'use strict';

require('mocha');
// Ensure we are using the 'as promised' libs before any tests are run:
require('chai').use(require('chai-as-promised'));

var expect = require('chai').expect;
var config  = require('../config.json');


describe("ai", function() {
  describe("snake", function() {

    it('Should find food on the map', function() {
      var snake = require('../lib/ai/snake')();
      var world = {
        food: [
          [0,1],[1,4]
        ]
      };
      expect(snake.foodIsOnTheMap(world)).to.be.true;
    });

    it('Should not find food on the map', function() {
      var snake = require('../lib/ai/snake')();
      var world = {
        food: [
          
        ]
      };
      expect(snake.foodIsOnTheMap(world)).to.be.false;
    });

    it('Should calculate manhattan distance', function() {
      var snake = require('../lib/ai/snake')();
      var dist = snake.d([0,0], [0,5]);
      expect(dist).to.equal(5);
      dist = snake.d([0,0], [1,5]);
      expect(dist).to.equal(6);
      dist = snake.d([1,5], [0,0]);
      expect(dist).to.equal(6);
    });

    it('Should build nav board', function() {
      
      var mySnake = {coords:[ [1,7], [2,7] ], name: config.snake.name};
      var world = {
        board: {
          width: 10,
          height: 10
        },
        food: [ [4,4] ],
        snakes: [
          {coords:[ [1,1], [1,2] ]},
          mySnake
        ]
      };
      var snake = require('../lib/ai/snake')(mySnake, world, true); // true: ignore predictive blocking for this test

      var board = snake.buildBoard(world);
      expect(board).to.exist;
      board.prettyPrint();
      expect(board.get(0,0)).to.equal(2); // caution spot
      expect(board.get(1,0)).to.equal(3); // threat spot
      expect(board.get(1,7)).to.equal(0); // blocked spot
      expect(board.get(3,0)).to.equal(1); // open spot
    });

    it('Should find snake head', function() {
      
      var mySnake = {coords:[ [0,5], [0,6], [0,7] ], name: config.snake.name};
      var world = {
        board: {
          width: 10,
          height: 10
        },
        food: [ ],
        snakes: [
          {coords:[ [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3] ]},
          mySnake
        ]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);

      var head = snake.head();
      expect(head).to.exist;
      expect(head[0]).to.equal(0);
      expect(head[1]).to.equal(5);
    });

    it('Should use predictive blocking', function() {
      
      var mySnake = {coords:[ [5,5], [5,6] ], name: config.snake.name};
      var world = {
        board: {
          width: 10,
          height: 10
        },
        food: [ ],
        snakes: [
          {coords:[ [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3] ]},
          mySnake
        ]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);

      var board = snake.buildBoard(world);
      expect(board).to.exist;
      board.prettyPrint();
      expect(board.get(5,3)).to.equal(0);
      expect(board.get(6,3)).to.equal(1);
      expect(board.get(7,3)).to.equal(1);
    });

    it('Should use predictive blocking behind tail', function() {
      
      var mySnake = {coords:[ [8,5], [8,6], [8,7] ], name: config.snake.name};
      var world = {
        board: {
          width: 10,
          height: 10
        },
        food: [ ],
        snakes: [
          {coords:[ [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3] ]},
          mySnake
        ]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);

      var board = snake.buildBoard(world);
      expect(board).to.exist;
      board.prettyPrint();
      expect(board.get(1,3)).to.equal(0);
      expect(board.get(2,3)).to.equal(3);
      expect(board.get(3,3)).to.equal(2);
      expect(board.get(4,3)).to.equal(1);
      expect(board.get(5,3)).to.equal(1);
      expect(board.get(6,3)).to.equal(1);
      expect(board.get(7,3)).to.equal(1);
    });

    it('Should use predictive blocking infront of head', function() {
      
      var mySnake = {coords:[ [0,5], [0,6], [0,7] ], name: config.snake.name};
      var world = {
        board: {
          width: 10,
          height: 10
        },
        food: [ ],
        snakes: [
          {coords:[ [1,3], [2,3], [3,3], [4,3], [5,3], [6,3], [7,3] ]},
          mySnake
        ]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);

      var board = snake.buildBoard(world);
      expect(board).to.exist;
      board.prettyPrint();
      expect(board.get(1,3)).to.equal(0);
      expect(board.get(2,3)).to.equal(0);
      expect(board.get(3,3)).to.equal(0);
      expect(board.get(4,3)).to.equal(1);
      expect(board.get(5,3)).to.equal(1);
      expect(board.get(6,3)).to.equal(1);
      expect(board.get(7,3)).to.equal(1);
    });

    it('Should be near top', function() {
      
      var mySnake = {coords:[ [5,1] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      expect(snake.nearTop()).to.be.true;
    });

    it('Should NOT be near top', function() {
      
      var mySnake = {coords:[ [5,2] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      expect(snake.nearTop()).to.be.false;
    });

    it('Should be near right', function() {
      
      var mySnake = {coords:[ [9,1] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      expect(snake.nearTop()).to.be.true;
    });

    it('Should NOT be near right', function() {
      
      var mySnake = {coords:[ [7,2] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      expect(snake.nearTop()).to.be.false;
    });

    it('Should be near bottom', function() {
      
      var mySnake = {coords:[ [5,8] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      snake.buildBoard(world);
      expect(snake.nearBottom()).to.be.true;
    });

    it('Should NOT be near bottom', function() {
      
      var mySnake = {coords:[ [7,7] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      snake.buildBoard(world);
      expect(snake.nearBottom()).to.be.false;
    });

    it('Should be near left', function() {
      
      var mySnake = {coords:[ [0,8] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      snake.buildBoard(world);
      expect(snake.nearLeft()).to.be.true;
    });

    it('Should NOT be near left', function() {
      
      var mySnake = {coords:[ [2,7] ], name: config.snake.name};
      var world = {
        board: {width: 10,height: 10},
        snakes: [mySnake]
      };
      var snake = require('../lib/ai/snake')(mySnake, world);
      snake.buildBoard(world);
      expect(snake.nearLeft()).to.be.false;
    });

    it('Should get direction string', function() {
      
      var snake = require('../lib/ai/snake')();
      expect(snake.getDirString(0)).to.equal("north");
      expect(snake.getDirString(1)).to.equal("east");
      expect(snake.getDirString(2)).to.equal("south");
      expect(snake.getDirString(3)).to.equal("west");
    });

// ========================= STATES ==============================
    describe("STATES", function() {

      describe("moveToSafeSpotState.getWiseDirection", function() {
        it('Should pick north location', function() {
          // pointing up
          var mySnake = {coords:[ [4,5],[4,6] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(0);
        });
        it('Should pick south location', function() {
          // pointing down
          var mySnake = {coords:[ [4,6],[4,5] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(2);
        });
        it('Should pick east location', function() {
          // pointing right
          var mySnake = {coords:[ [5,5],[4,5] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(1);
        });
        it('Should pick west location', function() {
          // pointing left
          var mySnake = {coords:[ [4,5],[5,5] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(3);
        });

        it('Should pick north location from corners', function() {
          // pointing right in SE corner
          var mySnake = {coords:[ [8,8],[7,8] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(0);

          // pointing left in SW corner
          mySnake = {coords:[ [1,8],[2,8] ], name: config.snake.name};
          world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          dir = snake.getWiseDirection();
          expect(dir).to.equal(0);
        });

        it('Should pick south location from corners', function() {
          // pointing right in NE corner
          var mySnake = {coords:[ [8,1],[7,1] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(2);

          // pointing left in NW corner
          mySnake = {coords:[ [1,1],[2,1] ], name: config.snake.name};
          world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          dir = snake.getWiseDirection();
          expect(dir).to.equal(2);
        });

        it('Should pick west location from corners', function() {
          // pointing down in SE corner
          var mySnake = {coords:[ [8,8],[8,7] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(3);

          // pointing up in NE corner
          mySnake = {coords:[ [7,1],[7,2] ], name: config.snake.name};
          world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          dir = snake.getWiseDirection();
          expect(dir).to.equal(3);
        });

        it('Should pick east location from corners', function() {
          // pointing down in SW corner
          var mySnake = {coords:[ [1,8],[1,7] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var dir = snake.getWiseDirection();
          expect(dir).to.equal(1);

          // pointing up in NW corner
          mySnake = {coords:[ [1,1],[1,2] ], name: config.snake.name};
          world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          dir = snake.getWiseDirection();
          expect(dir).to.equal(1);
        });
      });

      describe("moveToSafeSpotState.findTargetInDistance", function() {
        it('Should find north location', function() {
          // pointing up
          var mySnake = {coords:[ [4,5],[4,6] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var loc = snake.findTargetInDistance(0);
          expect(loc).to.exist;
          expect(loc[0]).to.equal(4);
          expect(loc[1]).to.equal(2);
        });
      
        it('Should find east location', function() {
          // pointing right
          var mySnake = {coords:[ [4,5],[3,5] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var loc = snake.findTargetInDistance(1);
          expect(loc).to.exist;
          expect(loc[0]).to.equal(7);
          expect(loc[1]).to.equal(5);
        });

        it('Should find south location', function() {
          // pointing down
          var mySnake = {coords:[ [4,5],[4,4] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var loc = snake.findTargetInDistance(2);
          expect(loc).to.exist;
          expect(loc[0]).to.equal(4);
          expect(loc[1]).to.equal(7);
        });

        it('Should find west location', function() {
          // pointing left
          var mySnake = {coords:[ [4,5],[5,5] ], name: config.snake.name};
          var world = {
            board: {width: 10,height: 10},
            snakes: [mySnake]
          };
          var snake = require('../lib/ai/snake')(mySnake, world);
          snake.buildBoard(world);
          var loc = snake.findTargetInDistance(3);
          expect(loc).to.exist;
          expect(loc[0]).to.equal(2);
          expect(loc[1]).to.equal(5);
        });

      });

    });
  });
});
