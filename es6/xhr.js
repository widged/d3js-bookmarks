function xhr(path, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(xhr.responseText);
    }
  };
  xhr.send();
  return xhr;
}
