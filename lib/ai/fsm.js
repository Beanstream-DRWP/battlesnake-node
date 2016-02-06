'use strict';


function Fsm() {
  if (!(this instanceof Fsm)) {
    return new Fsm();
  }

  this.stateStack = [];
}


Fsm.prototype = {

  push: function(state) {
    console.log('pushing state '+state);
    this.stateStack.push({func:state});
  },

  pop: function() {
    if (this.stateStack && this.stateStack.length > 0) {
      return this.stateStack.pop().func; // return the popped state function
    }
  },

  getCurrentState: function() {
    if (this.stateStack && this.stateStack.length > 0)
      return this.stateStack[this.stateStack.length-1].func;
    else
      return null;
  },

  /*
  Replace the current state (pop/push)
  */
  replaceCurrentState: function(state) {
    this.pop();
    this.push(state);
  },

  /*
  Run an update on the state given the world view
  */
  update: function(snakeObject) {
    //return this.getCurrentState()(snakeObject);

    // NEW temporary string-based FSM:
    var state = this.getCurrentState();
    console.log("Updating state "+state);
    if (state == "idle")
      return snakeObject.idleState(snakeObject.mySnake, snakeObject.world);
    else if (state == "moveToSafeSpot")
      return snakeObject.moveToSafeSpotState(snakeObject.mySnake, snakeObject.world);
    else if (state == "findFoodToEat")
      return snakeObject.findFoodToEatState(snakeObject.mySnake, snakeObject.world);
  },

  /*
  Return the stackState in a string array
  */
  serialize: function() {
    /*var serialized = [];
    var s;
    for (s of this.stateStack) {
      serialized.push(s.name);
    }
    return serialized;*/
  }

}

module.exports = Fsm;
module.exports.Fsm = Fsm;