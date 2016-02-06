'use strict';

require('mocha');
// Ensure we are using the 'as promised' libs before any tests are run:
require('chai').use(require('chai-as-promised'));

var expect = require('chai').expect;
var config  = require('../config.json');


describe("api", function() {
  describe("service", function() {
    it('Should find my snake', function() {
      var service = require('../lib/service')();

      var world = {
        snakes: [
          {id: 'test', color: '000000', taunt: 'one'},
          {id: config.snake.id, color: '00FF00', taunt: 'bean'},
          {id: 'other', color: 'FFFFFF', taunt: 'other one'}
        ]
      };
      var mine = service._findMySnake(world);
      expect(mine).to.not.be.null;
      expect(mine.id).to.equal(config.snake.id);
    });

    it('Should start a game', function() {
      var service = require('../lib/service')();

      var world = {
        game: 'testGame1',
        mode: 'test',
        turn: '0',
        snakes: [
          {id: 'test', color: '000000', taunt: 'one'},
          {id: config.snake.id, color: '00FF00', taunt: 'bean'},
          {id: 'other', color: 'FFFFFF', taunt: 'other one'}
        ]
      };
      var response = service.StartGame(world);
      expect(response).to.not.be.null;
      expect(response.taunt).to.equal(config.snake.taunt.start);
      expect(service.NumberOfGames()).to.equal(1);
    });

    it('Should end a game', function() {
      var service = require('../lib/service')();

      var world = {
        game: 'testGame1',
        mode: 'test',
        turn: '0',
        snakes: [
          {id: 'test', color: '000000', taunt: 'one'},
          {id: config.snake.id, color: '00FF00', taunt: 'bean'},
          {id: 'other', color: 'FFFFFF', taunt: 'other one'}
        ]
      };
      var response = service.StartGame(world);
      expect(response).to.not.be.null;
      expect(response.taunt).to.equal(config.snake.taunt.start);
      expect(service.NumberOfGames()).to.equal(1);

      // end the game
      service.End(world);
      expect(service.NumberOfGames()).to.equal(0);
    });
    
  });
});
