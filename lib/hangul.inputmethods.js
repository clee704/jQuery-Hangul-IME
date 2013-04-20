/*!
 * hangul.js Core 1.1
 * http://github.com/clee704/hangul-js
 *
 * Copyright 2011, Choongmin Lee
 * Licensed under the MIT license.
 */
(function (window, undefined) {
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this === void 0 || this === null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n !== n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    };
}


function Set() {
    var i;
    this.items = {};
    for (i = 0; i < arguments.length; i++) {
        this.add(arguments[i]);
    }
}

Set.prototype.has = function (e) {
    return e in this.items;
};

Set.prototype.add = function (e) {
    this.items[e] = 1;
};


/**
 * Constructs a simple map, supporting an inverse view, optionally
 * containing properties of the specified object as entries if it is present.
 */
function Map(o, _inverse) {
    this.items = {};
    this.inverse = _inverse || new Map(undefined, this);
    if (o) {
        this.addAll(o);
    }
}

Map.prototype.add = function (k, v) {
    this.items[k] = v;
    this.inverse.items[v] = k;
};

Map.prototype.addAll = function (o) {
    var k;
    for (k in o) {
        this.add(k, o[k]);
    }
};

Map.prototype.hasKey = function (k) {
    return k in this.items;
};

Map.prototype.hasValue = function (v) {
    return v in this.inverse.items;
};

Map.prototype.get = function (k) {
    return this.items[k];
};


/** List of modern hangul jamo (U+3131-U+3163). */
var jamo = collectJamo(0x3131, 0x3163);

/**
 * List of modern hangul initial jamo. Actually some of these charaters are
 * not just initials, but can also be final jamo. Thus many characters in this
 * list overlap with the characters in {finals}.
 */
var initials = collectJamo(0x3131, 0x314e, [2, 4, 5, 9, 10, 11, 12, 13, 14, 15, 19]);

/** List of modern hangul medials. */
var medials = collectJamo(0x314f, 0x3163);

/**
 * List of modern hangul finals. The details are the same as {initials}.
 * The list does not include a filler.
 */
var finals = collectJamo(0x3131, 0x314e, [7, 18, 24]);

function collectJamo(from, to, exclude) {
    var map = new Map(),
        length = to - from + 1,
        i;
    for (i = 0, j = 0; i < length; i++) {
        if (!exclude || exclude.indexOf(i) < 0) {
            map.add(j++, String.fromCharCode(i + from));
        }
    }
    return map;
}


/**
 * Returns true if the first character of the specified string represents
 * modern hangul characters (U+3131-U+3163 and U+AC00-U+D7A3; no support for
 * the "Hangul Jamo", "Hangul Jamo Extended-A", "Hangul Jamo Extended-B"
 * blocks).
 */
function isHangul(s) {
    var c = s && s.charAt && s.charAt(0);
    return jamo.hasValue(c) || isSyllable(c);
}

/**
 * Returns true if the first character of the specified string represents
 * modern hangul syllables (U+AC00-U+D7A3).
 */
function isSyllable(s) {
    var code = s && s.charCodeAt && s.charCodeAt(0);
    return 0xac00 <= code && code <= 0xd7a3;
}

/**
 * Returns true if the first character of the specified string represents
 * modern jamo (U+3131-U+3163).
 */
function isJamo(s) {
    return jamo.hasValue(s && s.charAt && s.charAt(0));
}

/**
 * Returns true if the first character of the specified string represents
 * modern hangul initials.
 */
function isInitial(s) {
    return initials.hasValue(s && s.charAt && s.charAt(0));
}

/**
 * Returns true if the first character of the specified string represents
 * modern hangul medials.
 */
function isMedial(s) {
    return medials.hasValue(s && s.charAt && s.charAt(0));
}

/**
 * Returns true if the first character of the specified string represents
 * modern hangul finals.
 */
function isFinal(s) {
    return finals.hasValue(s && s.charAt && s.charAt(0));
}


/**
 * Returns the initial of the first chacater of the specified string.
 * Returns undefined if the character is not a hangul syllable.
 */
function getInitial(s) {
    var code = s && s.charCodeAt && s.charCodeAt(0);
    return initials.get(Math.floor((code - 0xac00) / 28 / 21));
}

/**
 * Returns the medial of the first chacater of the specified string.
 * Returns undefined if the character is not a hangul syllable.
 */
function getMedial(s) {
    var code = s && s.charCodeAt && s.charCodeAt(0);
    return medials.get(Math.floor((code - 0xac00) / 28) % 21);
}

/**
 * Returns the final of the first chacater of the specified string, or
 * an empty string '' if the syllable has no final jamo. Returns undefined
 * if the character is not a hangul syllable.
 */
function getFinal(s) {
    var code = s && s.charCodeAt && s.charCodeAt(0),
        i = (code - 0xac00) % 28;
    return i > 0 ? finals.get(i - 1) : i === 0 ? '' : undefined;
}


/**
 * Decomposes the first character of the specified string into constituent
 * jamo and returns them as an array of length 3 (or 2 if there is no final).
 * They are obtained using {intial()}, {medial()} and {final_()}. Returns
 * undefined if the character is not a hangul syllable.
 */
function decompose(s) {
    var c = s && s.charAt && s.charAt(0),
        jamo;
    if (!isSyllable(c)) {
        return undefined;
    }
    jamo = [getInitial(c), getMedial(c), getFinal(c)];
    if (jamo[2] === '') {
        jamo.pop();
    }
    return jamo;
}

/**
 * Composes from the specified constituent jamo a hangul syllable. Use
 * undefined or an empty string '' for the final filler. Returns undefined if
 * any of the arguments are not a modern jamo, except for the final which can
 * also be either undefined or an empty string.
 */
function compose(ini, med, fin) {
    var x = initials.inverse.get(ini),
        y = medials.inverse.get(med),
        z = fin === undefined || fin === '' ? 0 : finals.inverse.get(fin) + 1,
        c = String.fromCharCode(0xac00 + (x * 21 + y) * 28 + z);
    return isSyllable(c) ? c : undefined;
}


/**
 * List of modern hangul double jamo (clusters and compounds).
 */
var doubleJamo = new Map({
    '\u3133': '\u3131\u3145', '\u3135': '\u3134\u3148',
    '\u3136': '\u3134\u314e', '\u313a': '\u3139\u3131',
    '\u313b': '\u3139\u3141', '\u313c': '\u3139\u3142',
    '\u313d': '\u3139\u3145', '\u313e': '\u3139\u314c',
    '\u313f': '\u3139\u314d', '\u3140': '\u3139\u314e',
    '\u3144': '\u3142\u3145', '\u3132': '\u3131\u3131',
    '\u3138': '\u3137\u3137', '\u3143': '\u3142\u3142',
    '\u3146': '\u3145\u3145', '\u3149': '\u3148\u3148',
    '\u3158': '\u3157\u314f', '\u3159': '\u3157\u3150',
    '\u315a': '\u3157\u3163', '\u315d': '\u315c\u3153',
    '\u315e': '\u315c\u3154', '\u315f': '\u315c\u3163',
    '\u3162': '\u3161\u3163'
});

/**
 * Composes from the specified jamo a double jamo. Returns undefined if
 * the specified jamo do not make a double jamo.
 */
function composeDoubleJamo(c1, c2) {
    return doubleJamo.inverse.get(c1 + c2);
}

/**
 * Decomposes the specified double jamo into two jamo and returns them as an
 * array of length 2. Returns undefined if the specified jamo is not a double
 * jamo.
 */
function decomposeDoubleJamo(c) {
    var cc = doubleJamo.get(c);
    return cc === undefined ? cc : [cc.charAt(0), cc.charAt(1)];
}


var iotizedVowels = new Set(
    '\u3163', '\u3151', '\u3152', '\u3155', '\u3156', '\u315b', '\u3160'
);

/**
 * Returns true if the first character of the specified string represents
 * a iotized vowel (including the close front vowel) that may cause
 * palatalization.
 */
function isIotizedVowel(s) {
    return iotizedVowels.has(s && s.charAt && s.charAt(0));
}


var hangul = {

    Set: Set,
    Map: Map,

    jamo: jamo,
    initials: initials,
    medials: medials,
    finals: finals,

    isHangul: isHangul,
    isSyllable: isSyllable,
    isJamo: isJamo,
    isInitial: isInitial,
    isMedial: isMedial,
    isFinal: isFinal,

    getInitial: getInitial,
    getMedial: getMedial,
    getFinal: getFinal,

    decompose: decompose,
    compose: compose,

    composeDoubleJamo: composeDoubleJamo,
    decomposeDoubleJamo: decomposeDoubleJamo,

    isIotizedVowel: isIotizedVowel

};
// Expose hangul.js to the global object
window.hangul = hangul;
})(window);
/*!
 * hangul.js Dubeol 1.1
 * http://github.com/clee704/hangul-js
 *
 * Copyright 2011, Choongmin Lee
 * Licensed under the MIT license.
 */
(function (hangul, undefined) {


var map = new hangul.Map();
map.addAll({
    'A': '\u3141', 'B': '\u3160', 'C': '\u314a', 'D': '\u3147', 'E': '\u3138',
    'F': '\u3139', 'G': '\u314e', 'H': '\u3157', 'I': '\u3151', 'J': '\u3153',
    'K': '\u314f', 'L': '\u3163', 'M': '\u3161', 'N': '\u315c', 'O': '\u3152',
    'P': '\u3156', 'Q': '\u3143', 'R': '\u3132', 'S': '\u3134', 'T': '\u3146',
    'U': '\u3155', 'V': '\u314d', 'W': '\u3149', 'X': '\u314c', 'Y': '\u315b',
    'Z': '\u314b'
});
// all the mappings in the inverse map is overwritten by the following call to
// addAll except for the five tense consonants, which are mapped by Q, W, E, R
// and T, repectively.
map.addAll({
    'a': '\u3141', 'b': '\u3160', 'c': '\u314a', 'd': '\u3147', 'e': '\u3137',
    'f': '\u3139', 'g': '\u314e', 'h': '\u3157', 'i': '\u3151', 'j': '\u3153',
    'k': '\u314f', 'l': '\u3163', 'm': '\u3161', 'n': '\u315c', 'o': '\u3150',
    'p': '\u3154', 'q': '\u3142', 'r': '\u3131', 's': '\u3134', 't': '\u3145',
    'u': '\u3155', 'v': '\u314d', 'w': '\u3148', 'x': '\u314c', 'y': '\u315b',
    'z': '\u314b'
});


function fromQwerty(text) {
    var buffer = [],
        m = new DubeolAutomaton(buffer),
        i;
    for (i = 0; i < text.length; i++) {
        m.next(text.charAt(i));
    }
    m.next();
    return buffer.join('');
}

function DubeolAutomaton(output) {
    this.output = output;
    this.currentBlock = undefined;
    this._prevJamo = undefined;
}

DubeolAutomaton.prototype.reset = function () {
    this.currentBlock = undefined;
    this._prevJamo = undefined;
};

DubeolAutomaton.prototype.next = function (key) {
    this.currentBlock = this._next(key);
};

DubeolAutomaton.prototype._next = function (currKey) {
    var buffer = this.output,
        block = this.currentBlock,
        currJamo = map.get(currKey),
        prevJamo = this._prevJamo,
        c,
        d,
        cc,
        jamo;
    this._prevJamo = currJamo;
    if (currKey === '\b') {
        c = undefined;
        if (block === undefined) {
            buffer.pop();
        } else if (hangul.isSyllable(block)) {
            jamo = hangul.decompose(block);
            if (jamo[2]) {
                c = hangul.compose(jamo[0], jamo[1]);
            } else {
                c = jamo[0];
            }
        }
        return c;
    }
    if (!map.hasKey(currKey)) {
        this._flush();
        if (currKey !== undefined)
            buffer.push(currKey);
        return undefined;
    }
    d = hangul.composeDoubleJamo(prevJamo, currJamo);
    if (map.hasValue(d)) {
        d = undefined;
    }
    if (d && !hangul.isSyllable(block)) {
        return d;
    }
    if (d) {
        jamo = hangul.decompose(block);
        jamo[hangul.isMedial(d) ? 1 : 2] = d;
        return hangul.compose.apply(hangul, jamo);
    }
    if (hangul.isFinal(currJamo)) {
        if (!hangul.isSyllable(block) || hangul.getFinal(block) !== '') {
            this._flush();
            return currJamo;
        }
        jamo = hangul.decompose(block);
        return hangul.compose(jamo[0], jamo[1], currJamo);
    }
    if (hangul.isInitial(currJamo)) {
        this._flush();
        return currJamo;
    }
    if (hangul.isInitial(block)) {
        return hangul.compose(block, currJamo, '');
    }
    if (!hangul.isSyllable(block) || !hangul.isInitial(prevJamo)) {
        this._flush();
        return currJamo;
    }
    jamo = hangul.decompose(block);
    if (hangul.isInitial(jamo[2])) {
        buffer.push(hangul.compose(jamo[0], jamo[1], ''));
        return hangul.compose(jamo[2], currJamo, '');
    }
    cc = hangul.decomposeDoubleJamo(jamo[2]);
    buffer.push(hangul.compose(jamo[0], jamo[1], cc[0]));
    return hangul.compose(cc[1], currJamo, '');
};

DubeolAutomaton.prototype._flush = function () {
    if (this.currentBlock !== undefined)
        this.output.push(this.currentBlock);
};


function toQwerty(text) {
    var buffer = [],
        i;
    for (i = 0; i < text.length; i++)
        _toQwerty(buffer, text.charAt(i));
    return buffer.join('');
}

function _toQwerty(buffer, currKey) {
    var cc,
        jamo,
        i,
        c;
    if (map.hasValue(currKey)) {
        buffer.push(map.inverse.get(currKey));
        return;
    }
    cc = hangul.decomposeDoubleJamo(currKey);
    if (cc) {
        buffer.push(map.inverse.get(cc[0]));
        buffer.push(map.inverse.get(cc[1]));
        return;
    }
    if (!hangul.isSyllable(currKey)) {
        buffer.push(currKey);
        return;
    }
    jamo = hangul.decompose(currKey);
    for (i = 0; i < jamo.length; i++) {
        c = jamo[i];
        if (map.hasValue(c)) {
            buffer.push(map.inverse.get(c));
            continue;
        }
        cc = hangul.decomposeDoubleJamo(c);
        buffer.push(map.inverse.get(cc[0]));
        buffer.push(map.inverse.get(cc[1]));
    }
}


var dubeol = {
    map: map,
    fromQwerty: fromQwerty,
    toQwerty: toQwerty,
    Automaton: DubeolAutomaton
};


hangul.dubeol = dubeol;


})(hangul);
/*!
 * hangul.js Sebeol 1.1
 * http://github.com/clee704/hangul-js
 *
 * Copyright 2011, Choongmin Lee
 * Licensed under the MIT license.
 */
(function (hangul, undefined) {


var Wrap = (function () {
    var cache = {},
        entry;
    return function (type, c)  {
        entry = cache[type] || (cache[type] = {});
        return entry[c] || (entry[c] = new Character(type, c));
    }
})();

function Character(type, c) {
    this.type = type;
    this.c = c;
    this.code = c.charCodeAt(0);
    this.string = type + '[' + c + ']';
}

Character.prototype.toString = function () {
    return this.string;
};

var map = new hangul.Map();
// deliberatly avoided overlapping keys or values
map.addAll({
    '\'': initial('\u314c'), '0': initial('\u314b'), ';': initial('\u3142'),
    'h': initial('\u3134'), 'i': initial('\u3141'), 'j': initial('\u3147'),
    'k': initial('\u3131'), 'l': initial('\u3148'), 'm': initial('\u314e'),
    'n': initial('\u3145'), 'o': initial('\u314a'), 'p': initial('\u314d'),
    'u': initial('\u3137'), 'y': initial('\u3139'), '4': medial('\u315b'),
    '5': medial('\u3160'), '6': medial('\u3151'), '7': medial('\u3156'),
    '8': medial('\u3162'), 'G': medial('\u3152'), 'b': medial('\u315c'),
    'c': medial('\u3154'), 'd': medial('\u3163'), 'e': medial('\u3155'),
    'f': medial('\u314f'), 'g': medial('\u3161'), 'r': medial('\u3150'),
    't': medial('\u3153'), 'v': medial('\u3157'), '/': medialSp('\u3157'),
    '9': medialSp('\u315c'), '!': final_('\u3132'), '#': final_('\u3148'),
    '$': final_('\u313f'), '%': final_('\u313e'), '1': final_('\u314e'),
    '2': final_('\u3146'), '3': final_('\u3142'), '@': final_('\u313a'),
    'A': final_('\u3137'), 'C': final_('\u314b'), 'D': final_('\u313c'),
    'E': final_('\u3135'), 'F': final_('\u313b'), 'Q': final_('\u314d'),
    'R': final_('\u3140'), 'S': final_('\u3136'), 'T': final_('\u313d'),
    'V': final_('\u3133'), 'W': final_('\u314c'), 'X': final_('\u3144'),
    'Z': final_('\u314a'), 'a': final_('\u3147'), 'q': final_('\u3145'),
    's': final_('\u3134'), 'w': final_('\u3139'), 'x': final_('\u3131'),
    'z': final_('\u3141'), '"': symbol('\u00b7'), '&': symbol('\u201c'),
    '(': symbol('\''), ')': symbol('~'), '*': symbol('\u201d'),
    '+': symbol('+'), ',': symbol(','), '-': symbol(')'),
    '.': symbol('.'), ':': symbol('4'), '<': extra(','),
    '=': symbol('>'), '>': extra('.'), '?': symbol('!'),
    'B': symbol('?'), 'H': symbol('0'), 'I': symbol('7'),
    'J': symbol('1'), 'K': symbol('2'), 'L': symbol('3'),
    'M': symbol('"'), 'N': symbol('-'), 'O': symbol('8'),
    'P': symbol('9'), 'U': symbol('6'), 'Y': symbol('5'),
    '[': symbol('('), '\\': symbol(':'), ']': symbol('<'),
    '^': symbol('='), '_': symbol(';'), '`': symbol('*'),
    '{': symbol('%'), '|': symbol('\\'), '}': symbol('/'),
    '~': symbol('\u203b')
});

function initial(c) {
    return Wrap('initial', c);
}

function medial(c) {
    return Wrap('medial', c);
}

// denotes a medial that may make a compound vowel
// (there are two such characters, which are mapped by / and 9 repectively)
function medialSp(c) {
    return Wrap('medial-special', c);
}

function final_(c) {
    return Wrap('final', c);
}

function symbol(c) {
    return Wrap('symbol', c);
}

// to avoid collisions with other symbols when searching inverse
function extra(c) {
    return Wrap('extra', c);
}


/**
 * Converts the specified text typed in QWERTY to a text that the same
 * keystrokes which made the text would have produced if the input method is
 * Sebeolsik Final. It assumes the specified text is typed with CapsLock off.
 * If the text contains characters that cannot be typed in QWERTY, they are
 * preserved.
 */
function fromQwerty(text) {
    var buffer = [],
        m = new SebeolAutomaton(buffer),
        i;
    for (i = 0; i < text.length; i++) {
        m.next(text.charAt(i));
    }
    m.next();
    return buffer.join('');
}

function SebeolAutomaton(output) {
    this.output = output;
    this.currentBlock = undefined;
    this._indexes = {'initial': 0, 'medial': 1, 'medial-special': 1, 'final': 2};
    this._wrappers = {'initial': initial, 'medial': medial, 'final': final_};
    this._jamoBlock = [];
    this._jamoQueue = [];
}

SebeolAutomaton.prototype.reset = function () {
    this.currentBlock = undefined;
    this._jamoBlock.length = 0;
    this._jamoQueue.length = 0;
};

SebeolAutomaton.prototype.next = function (key) {
    var currJamo,
        i,
        jamo,
        x,
        d;
    if (key === '\b') {
        if (this._jamoQueue.length > 0) {
            currJamo = this._jamoQueue.pop();
            delete this._jamoBlock[this._indexes[currJamo.type]];
            this._renderCurrentBlock();
        } else {
            this.output.pop();
        }
        return;
    }
    if (!map.hasKey(key)) {
        this._flush();
        if (key !== undefined)
            this.output.push(key);
        return;
    }
    currJamo = map.get(key);
    if (!hangul.isJamo(currJamo.c)) {
        this._flush();
        this.output.push(currJamo.c);
        return;
    }
    i = this._indexes[currJamo.type];
    jamo = this._jamoBlock;
    x = jamo[i];
    if (x) {
        d = hangul.composeDoubleJamo(x.c, currJamo.c);
        if (d && (x.type === 'initial' && !jamo[1] && !jamo[2] && hangul.isInitial(d) || x.type === 'medial-special')) {
            jamo[i] = this._wrappers[currJamo.type](d);
            this._renderCurrentBlock();
            return;
        }
        this._flush();
    }
    jamo[i] = currJamo;
    this._jamoQueue.push(currJamo);
    this._renderCurrentBlock();
};

SebeolAutomaton.prototype._flush = function () {
    if (this.currentBlock !== undefined) {
        this.output.push(this.currentBlock);
        this.currentBlock = undefined;
    }
    this._jamoBlock.length = 0;
    this._jamoQueue.length = 0;
};

SebeolAutomaton.prototype._push = function (buffer, chars) {
    var i;
    for (i = 0; i < chars.length; i++) {
        if (i in chars) {
            buffer.push(chars[i].c);
        }
    }
};

SebeolAutomaton.prototype._renderCurrentBlock = function () {
    var jamo = this._jamoBlock,
        b;
    if (jamo[0]) {
        if (jamo[1]) {
            if (jamo[2]) {
                b = hangul.compose(jamo[0].c, jamo[1].c, jamo[2].c);
            } else {
                b = hangul.compose(jamo[0].c, jamo[1].c);
            }
        } else {
            b = jamo[0].c;
        }
    } else if (jamo[1]) {
        b = jamo[1].c;
    } else if (jamo[2]) {
        b = jamo[2].c;
    } else {
        b = undefined;
    }
    this.currentBlock = b;
};


function toQwerty(text) {
    var buffer = [],
        i;
    for (i = 0; i < text.length; i++) {
        _toQwerty(buffer, text.charAt(i));
    }
    return buffer.join('');
}

function _toQwerty(buffer, currKey) {
    var jamo;
    if (hangul.isJamo(currKey)) {
        return _putJamo(buffer, currKey, _getWrapper(currKey));
    }
    if (!hangul.isSyllable(currKey)) {
        return buffer.push(map.inverse.get(symbol(currKey)) || currKey);
    }
    jamo = hangul.decompose(currKey);
    _putJamo(buffer, jamo[0], initial);
    _putJamo(buffer, jamo[1], medial);
    if (jamo[2]) {
        _putJamo(buffer, jamo[2], final_);
    }
}

function _getWrapper(c) {
    // if the character is a consonant and can be either an initial or a
    // final, it is not possible to determine whether it is typed as an
    // intial or a final; here assumes it is an initial
    return hangul.isInitial(c) ? initial : hangul.isMedial(c) ? medial : final_;
}

function _putJamo(buffer, c, wrap) {
    var x = wrap(c),
        cc,
        wrap2;
    if (map.hasValue(x)) {
        return buffer.push(map.inverse.get(x));
    }
    cc = hangul.decomposeDoubleJamo(c);
    wrap2 = wrap === medial ? medialSp : initial;
    buffer.push(map.inverse.get(wrap2(cc[0])));
    buffer.push(map.inverse.get(wrap(cc[1])));
}


function _flatten(map) {
    var buckets = {},
        k,
        v,
        bucket,
        flatMap;
    for (k in map.items) {
        v = map.get(k);
        bucket = buckets[v.type] || (buckets[v.type] = {});
        bucket[k] = v.c;
    }
    flatMap = new hangul.Map();
    flatMap.addAll(buckets['extra']);
    flatMap.addAll(buckets['symbol']);
    flatMap.addAll(buckets['final']);
    flatMap.addAll(buckets['medial-special']);
    flatMap.addAll(buckets['medial']);
    flatMap.addAll(buckets['initial']);
    return flatMap;
}


var sebeol = {
    map: _flatten(map),
    fromQwerty: fromQwerty,
    toQwerty: toQwerty,
    Automaton: SebeolAutomaton
};


hangul.sebeol = sebeol;


})(hangul);
