/* jshint esnext: true */


class ItemList {
  constructor({ItemRenderer}) {
    this.props = {ItemRenderer};
    this.state = new StateManager(this.afterStateChange.bind(this));
    this.state.setInitial({items: []});
    this.refs = [];
  }

  afterStateChange(k, v, oldV) {
    if(k === 'items') {
      this.updateView();
    }
  }

  setItems(_) { this.state.set({items: _}); }

  // --------------------
  // Create Element
  // --------------------
  createElement() {
    if(!this.mountNode) {
      let node = document.createElement('item-list');
      this.mountNode = node;
    }
    this.updateView();
    return this.mountNode;
  }

  updateView() {
    let node = this.mountNode;
    const {ItemRenderer} = this.props;
    const {items} = this.state.get();

    // destroy nodes not in use.
    var children = Array.from(node.children);
    children.forEach((d, i) => {
      if(!items.hasOwnProperty(i)) {
        this.refs[i].destroyElement();
        delete this.refs[i];
        d.parentNode.removeChild(d);
      }
    });

    // destroy nodes not in use.
    items.forEach( (d,i) => {
      if(!children.hasOwnProperty(i)) {
        let ref = new ItemRenderer();
        this.refs[i] = ref;
        var itemNode = document.createElement('item');
        itemNode.dataset.idx = i;
        itemNode.appendChild(ref.createElement());
        node.appendChild(itemNode);
      }
      this.refs[i].setData(d, i);
    });
    return node;
  }

}

/*
class ItemListWithDelegation extends ItemList {
  createElement {
    super.createElement()
    const {ItemRenderer} = this.props;
      // delegate saves CPU when binding event handlers;
      // bind saves CPU when events trigger (e.g. a user clicks something, as events bubble up the DOM to the "root" element).
    if(ItemRenderer.hasOwnProperty('delegateEvents')) {
      ItemRenderer.delegateEvents({
        addEventListener: (eventType, eventFn) => {
          node.addEventListener(eventType, (e) => {
            eventFn(e, this.state.get().items);
          });
        }
      });
    }
  }
}
*/
