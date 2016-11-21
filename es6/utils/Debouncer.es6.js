/* jshint esnext: true */

class Debouncer {
  constructor(delay, cb) {
    this.state = {cb, delay};
    this.timeout = undefined;
    this.bound = { clear: this.clear.bind(this) };
  }

  clear() {
    if(this.timeout) {
      clearTimeout(this.timeout); this.timeout = undefined;
    }
  }

  trigger() {
    var {cb, delay} = this.state;
    var clear = this.bound.clear;
    clear();
		this.timeout = setTimeout(
      () => { clear();  cb(); },
      delay
    );
  }
}
