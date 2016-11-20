/* jshint esnext: true */

class RemovableItems {

  constructor(onChange) {
    var node = document.createElement('removable-items');
    node.addEventListener('click', (evt) => {
      var idx = evt.target.dataset.delete;
      if(idx !== undefined) {
        this.state.items.splice(idx, 1);
        this.update();
      }
    });
    this.state = {node, items: [], onChange};
  }

  addItem(item) {
    var {items} = this.state;
    if(!items.includes(item)) {
      this.state.items.push(item);
      this.update();
    }
  }

  update() {
    var {node, items, onChange} = this.state;
    node.innerHTML = items.map((d, i) => { return `<item>${d}<span data-delete="${i}">x</span></item>`; }).join(' ');
    onChange(items);
  }

  node() {
    let {node} = this.state;
    return node;
  }

  items() {
    return this.state.items;
  }
}
