/* jshint esnext: true */

class RemovableItemsPrivate {

  constructor({onChange, items}) {
    this.props = {onChange};
    this.bound = {
      onRemoveItem: this.onRemoveItem.bind(this)
    };
    this.state = new StateManager(this.afterStateChange.bind(this));
    if(!Array.isArray(items)) { items = []; }
    this.state.setInitial({items});
  }

  // --------------------
  // Public Accessors
  // --------------------
  addItem(item) {
    var {items} =  this.state.get();
    if(!items.includes(item)) {
      var clone = items.slice(0); clone.push(item);
      this.state.set({items: clone });
    }
  }

  // --------------------
  // Flow
  // --------------------
  onRemoveItem(idx) {
    var {items} =  this.state.get();
    var clone = items.slice(0); clone.splice(idx, 1);
    this.state.set({items: clone });
  }

  // --------------------
  // Dealing with state change
  // --------------------
  afterStateChange(k, v, mutated) {
    if(k === 'items' && mutated) {
      const {onChange} = this.props;
      onChange(v);
      this.updateView();
    }
  }

  // --------------------
  // Create Element
  // --------------------
  createElement() {
    if(!this.mountNode) {
      const {onRemoveItem} = this.bound;
      let node = document.createElement('removable-items');
      node.addEventListener('click', (evt) => {
        var idx = evt.target.dataset.removeidx;
        if(idx !== undefined) { onRemoveItem(parseInt(idx, 10)); }
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
    let node = this.mountNode;
    const {items} = this.state.get();
    node.innerHTML = items.map((d, i) => { return `<item>${d}<span data-removeidx="${i}">x</span></item>`; }).join(' ');
    return node;
  }
}

/**
 * Public interface
 */
class RemovableItems {
  constructor(props) { this.__private = new RemovableItemsPrivate(props); }
  addItem(item)  { return this.__private.addItem(item); }
  createElement() { return this.__private.createElement(); }
}
