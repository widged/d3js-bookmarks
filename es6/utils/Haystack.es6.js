/* jshint esnext: true */

"use strict";

var Haystack = {};

Haystack.nothingToDo = function (haystack, needles) {
    return (!Array.isArray(needles) || !Array.isArray(haystack));
};
Haystack.haystackTooSmall = function (haystack, needles) {
    var out = false;
    if (Haystack.nothingToDo(haystack, needles)) {
        out = true;
    }
    else if (haystack.length < needles.length) {
        out = true;
    }
    return out;
};
Haystack.allOf = function (haystack, needles) {
    var out = false;
    if (Haystack.haystackTooSmall(haystack, needles)) {
        out = false;
    }
    else {
        out = true;
        for (var _i = 0, needles_1 = needles; _i < needles_1.length; _i++) {
            var d = needles_1[_i];
            if (haystack.indexOf(d) === -1) {
                out = false;
                break;
            }
        }
    }
    return out;
};
Haystack.someOf = function (haystack, needles) {
    var out = false;
    if (Haystack.haystackTooSmall(haystack, needles)) {
        out = false;
    }
    else {
        out = false;
        for (var _i = 0, needles_2 = needles; _i < needles_2.length; _i++) {
            var d = needles_2[_i];
            if (haystack.indexOf(d) !== -1) {
                out = true;
                break;
            }
        }
    }
    return out;
};
Haystack.noneOf = function (haystack, needles) {
    var out = false;
    if (Haystack.nothingToDo(haystack, needles)) {
        out = false;
    }
    else {
        out = true;
        for (var _i = 0, needles_3 = needles; _i < needles_3.length; _i++) {
            var d = needles_3[_i];
            if (haystack.indexOf(d) !== -1) {
                out = false;
                break;
            }
        }
    }
    return out;
};
