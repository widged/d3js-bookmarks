/* jshint esnext: true */

class MultiSelect {
  constructor(placeholder, allItems, onChange) {
    var node = document.createElement('multi-select');
    node.innerHTML = `
<div class="removable"></div>
<div class="input"><input placeholder="${placeholder}"></input></div>
<div class="selectable"></div>
`;

    // selectable list
    if(typeof placeholder !== 'string') { placeholder = ''; }
    var onSelected = this.onSelected.bind(this);
    var selectable = new SelectableItems(allItems, onSelected);
    node.querySelector('.selectable').innerHTML = '';
    node.querySelector('.selectable').appendChild(selectable.node());
    node.addEventListener('focusout', () => { setTimeout(() => { selectable.hide(); }, 500); }, false);

    // active list
    var onRemovedChange = this.onRemovedChange.bind(this);
    var removable = new RemovableItems(onRemovedChange);
    node.querySelector('.removable').innerHTML = '';
    node.querySelector('.removable').appendChild(removable.node());

    // fragment input
    let input = node.querySelector('.input > input');
    input.addEventListener('click', () => {
      selectable.show();
    });
    input.addEventListener('keyup', (evt) => {
      var fragment = evt.target.value;
      selectable.fragment(fragment);
    });

    var render = this.render.bind(this);
    this.stateManager = new StateManager({
      node,
      placeholder,
      allItems,
      selectable,
      removable,
      input,
      onChange
    }, render);
  }

  setState(obj) {
    this.stateManager.set(obj);
  }


  onSelected(item) {
    let {removable, selectable, input, onChange} = this.stateManager.get();
    removable.addItem(item);
    selectable.deselect(removable.items());
    console.log(input.value)
    input.value = '';
    this.onRemovedChange();
  }

  onRemovedChange() {
    let {removable, selectable, onChange} = this.stateManager.get();
    selectable.deselect(removable.items());
    onChange(removable.items());
  }

  render(setState) {
    let {node, placeholder, selectable, removable} = this.stateManager.get();

  }

  node() {
    let {node} = this.stateManager.get();
    return node;

  }
}
