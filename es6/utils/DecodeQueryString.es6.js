/* jshint esnext: true */

function getQueryString(url) {
    url = url || location.href; //used location.href to avoid bug on IE6 and pseudo query string inside location.hash
    url = url.replace(/#.*/, ''); //removes hash (to avoid getting hash query)
    var queryString = /\?[a-zA-Z0-9\=\&\%\$\-\_\.\+\!\*\'\(\)\,\:\;]+/.exec(url); //valid chars according to: http://www.ietf.org/rfc/rfc1738.txt
    return (queryString)? decodeURIComponent(queryString[0]) : '';
}


function decodeQuery(str) {
    return (str || '').replace('?', '').split('&').reduce((acc, d, i) => {
      let [k,v] = d.split('=') || [];
      if(k){
        if (!/\D/.exec(v)) { v = parseInt(v, 10); }
        if (!/[^\d\.]/.exec(v)) { v = parseFloat(v); }
        acc[k] = v;
      }
      return acc;
    }, {});
}
