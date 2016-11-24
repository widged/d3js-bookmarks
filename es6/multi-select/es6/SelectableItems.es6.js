/* jshint esnext: true */

class SelectableItemsPrivate {

  constructor({onChange, items}) {
    this.bound = {
      onItemSelected: (item) => { onChange(item); }
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    items = (Array.isArray(items)) ? items.slice(0) : items = [];
    this.state.setInitial({ items, filterFn: () => { return true; } });
  }

  // --------------------
  // Public Accessors
  // --------------------
  setItems(_) {
    if(!Array.isArray(_)) { throw new TypeError(`SelectableItems.setItems expects an 'Array' as argument ${_}`); }
    this.state.set({items: _});
  }
  setFilterFn(_) {
    if(typeof _ !== 'function') { throw new TypeError(`SelectableItems.setFilterFn expects a 'function' as argument`); }
    this.state.set({filterFn: _});
  }

  // --------------------
  // Dealing with state change
  // --------------------
  afterStateChange(k, v, mutated) {
    if(['items', 'filterFn'].includes(k) && mutated) {
      this.updateView();
    }
  }

  // --------------------
  // Create Element
  // --------------------
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

  // --------------------
  // Update View
  // --------------------
  updateView() {
    var node = this.mountNode;
    const {items, filterFn} = this.state.get();
    const activeOptions = items.filter(filterFn);
    node.innerHTML = activeOptions.map((d) => { return `<item>${d}</item>`; }).join(' ');
    return node;
  }
}


/**
 * Public interface
 */
class SelectableItems {
  constructor(props) { this.__private = new SelectableItemsPrivate(props); }
  setItems(_)        { return this.__private.setItems(_); }
  setFilterFn(_)     { return this.__private.setFilterFn(_); }
  createElement()    { return this.__private.createElement(); }
}
