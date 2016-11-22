/* jshint esnext: true */

class StateManager {
  constructor(afterKeyChange, beforeKeySet) {
    if(typeof beforeKeySet   === 'function') { this.beforeKeySet   = beforeKeySet;   }
    if(typeof afterKeyChange === 'function') { this.afterKeyChange = afterKeyChange; }
    this.state = {};
    this.changed = new Set();
  }

  set(obj) {
    if(typeof obj !== 'object') { throw new TypeError('StateManager.set expects an object as parameter'); }
    if(typeof obj === 'object') {
      var keys = Object.keys(obj);
      keys.forEach((k) => {
        this.changed.add(k);
        var oldV = this.state[k];
        var v    = this.beforeKeySet(k, obj[k]);
        this.state[k] = v;
        this.afterKeyChange(k, v, v !== oldV, oldV);
      });
    }
  }

  setInitial(obj) {
    if(typeof obj !== 'object') { throw new TypeError('StateManager.set expects an object as parameter'); }
    this.state = Object.assign(this.state, obj);
    var keys = Object.keys(obj);
    keys.forEach((k) => { this.changed.add(k); });
  }

  get() {
    return this.state;
  }

  changes() {
    var l = Array.from(this.changed.values());
    this.changed = new Set();
    return l;
  }

  beforeKeySet(k, v) {
    return v;
  }

  afterKeyChange(key, v, oldV) {
    return v;
  }

}
