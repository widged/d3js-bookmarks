/* jshint esnext: true */

class PageNavigator {
  constructor(node) {
    this.state = {node};
      node.addEventListener('click', function(e) {
        var idx = e.target.dataset.idx;
        if(idx !== undefined) {
          setState({activePage: parseInt(idx, 10)});
        }
      });
  }
  render(pages, setState) {
    let node = this.state.node;
    node.innerHTML = pages.length < 2 ? '' : pages.map((d) => {

      return (d !== '...') ? `<item data-idx=${d-1}>${d}</item>` : d;
    }).join(' ');
  }

}
