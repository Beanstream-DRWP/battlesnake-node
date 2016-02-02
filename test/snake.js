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
    });

  });
});
