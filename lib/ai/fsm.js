'use strict';


function Fsm() {
  if (!(this instanceof Fsm)) {
    return new Fsm();
  }

  this.stateStack = [];
}


Fsm.prototype = {

  push: function(name, state) {
    this.stateStack.push({name:name,func:state});
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
  replaceCurrentState: function(name, state) {
    this.pop();
    this.push(name, state);
  },

  /*
  Run an update on the state given the world view
  */
  update: function(world) {
    return this.getCurrentState()(world);
  },

  /*
  Return the stackState in a string array
  */
  serialize: function() {
    var serialized = [];
    var s;
    for (s of this.stateStack) {
      serialized.push(s.name);
    }
    return serialized;
  }

}

module.exports = Fsm;
module.exports.Fsm = Fsm;