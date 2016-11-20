/* jshint esnext: true */

class StateManager {
  constructor(initialState, onChange) {
    this.state = initialState || {};
  }

  set(obj) {
    this.state = Object.assign(this.state, obj);
  }

  get() {
    return this.state;
  }

}
