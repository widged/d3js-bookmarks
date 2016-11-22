/* jshint esnext: true */

class BookmarksImporter {

  load(file, asyncReturn) {

    xhr(file, (tsv) => {

        var aTags = new Set(), aTerms = new Set();
        var db = tsv.split("\n").reduce((acc, d, i) => {
        if(d.length) {
          var [src, fmt, tags, terms, others] = d.split('\t');
          tags = (tags || '').split(';');
          tags.forEach((t) => { aTags.add(t); });
          terms = (terms || '').split(';');
          terms.forEach((t) => { aTerms.add(t); });
          others = (others || '').split(';');
          var url = 'http://bl.ocks.org/' + src;
          var thumb = 'etc/snapshots/_no-pict.png';
          if (fmt && fmt.indexOf('g') !== -1) {
            thumb = `https://gist.githubusercontent.com/${src}/raw/thumbnail.png`;
          } else if (fmt && fmt.indexOf('s') !== -1) {
            thumb = `etc/snapshots/raw_${src.replace('/','-')}.png`;
          }
          var doc = {src: url, thumb, fmt, tags, terms: terms, others};
          acc.push(doc);
        }
        return acc;
      }, []);

      asyncReturn({db, tags: Array.from(aTags.values()).sort(), terms: Array.from(aTerms.values()).sort()});

    });
  }

}
