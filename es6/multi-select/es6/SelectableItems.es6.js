/* jshint esnext: true */

class SelectableItems {

  constructor({onChange, items}) {
    this.bound = {
      onItemSelected: (item) => { onChange(item); }
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    items = (Array.isArray(items)) ? items.slice(0) : items = [];
    this.state.setInitial({ items, filterFn: () => { return true; } });
  }

  afterStateChange(k, v, mutated) {
    if(['items', 'filterFn'].includes(k) && mutated) {
      this.updateView();
    }
  }

  setFilterFn(_) {
    if(typeof _ !== 'function') { throw new TypeError(`SelectableItems.setFilterFn expects a 'function' as argument`); }
    this.state.set({filterFn: _}); }

  // #####################
  // # createElement
  // #####################
  createElement() {
    if(!this.mountNode) {
      let {onItemSelected} = this.bound;
      let node = document.createElement('selectable-items');
      node.addEventListener('click', (evt) => {
        if(evt.target.nodeName === 'ITEM') { onItemSelected(evt.target.innerText); }
      });
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

  // #####################
  // # createElement
  // #####################
  updateView() {
    var node = this.mountNode;
    const {items, filterFn} = this.state.get();
    const activeOptions = items.filter(filterFn);
    node.innerHTML = activeOptions.map((d) => { return `<item>${d}</item>`; }).join(' ');
    return node;
  }
}
