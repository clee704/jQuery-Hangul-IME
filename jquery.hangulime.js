/*!
 * jQuery Hangul IME 0.1
 *
 * Copyright 2011, Choongmin Lee
 * Licensed under the MIT license.
 *
 * Depends on:
 *     hangul.inputmethods.js (https://github.com/clee704/hangul-js)
 *     textinputs_jquery.js (http://code.google.com/p/rangyinputs)
 */
(function (jQuery, hangul, undefined) {

var settings = {},
    buffer = [],
    automata = {
        dubeol: new hangul.dubeol.Automaton(buffer),
        sebeol: new hangul.sebeol.Automaton(buffer)
    },
    automaton = automata.dubeol,
    inputMode = 'hangul';

function hangulime(newSettings) {
    setStatusLabel(newSettings.statusLabel);
    setLayoutSelector(newSettings.layoutChooser);
    setEditor(newSettings.editor);
}

function setStatusLabel(statusLabel) {
    if (settings.statusLabel) {
        $(settings.statusLabel).unbind('click', changeInputMode);
    }
    settings.statusLabel = statusLabel;
    if (statusLabel) {
        $(statusLabel).click(changeInputMode).text(inputMode === 'hangul' ? '\ud55c' : 'A');
    }
}

function setLayoutSelector(layoutChooser) {
    var s;
    if (settings.layoutChooser) {
        $(layoutChooser).unbind('click', layoutChanged);
    }
    settings.layoutChooser = layoutChooser;
    if (layoutChooser) {
        $(layoutChooser).click(layoutChanged);
        automaton = automata[$(layoutChooser + ':checked').val()];
        automaton.reset();
    }
}

function setEditor(editor) {
    var listeners = {
        'keypress': keypress,
        'keydown': keydown,
        'mousedown': reset,
        'blur': reset
    };
    if (settings.editor) {
        $(settings.editor).die(listeners);
    }
    settings.editor = editor;
    if (editor) {
        $(editor).live(listeners);
    }
}

function changeInputMode() {
    inputMode = (inputMode === 'hangul' ? 'qwerty' : 'hangul');
    if (settings.statusLabel) {
        $(settings.statusLabel).text(inputMode === 'hangul' ? '\ud55c' : 'A');
    }
    automaton.reset();
}

function layoutChanged() {
    automaton = automata[$(this).val()];
    automaton.reset();
}

function keypress(e) {
    var c = e.which;
    // In Firefox, special keys also trigger keypress events; so filter them
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey && (c == 32 || c == 229) ||
            c == 0 || c == 8 || c == 9 || c == 19 || c == 20 || c == 145) {
        return;
    }
    if (inputMode === 'hangul') {
        put($(this), e.which);
        return false;
    }
}

function keydown(e) {
    var c = e.which,
        editor;
    if (e.shiftKey && (e.which == 32 || e.which == 229)) {
        changeInputMode();
        return false;
    } else if (inputMode === 'hangul') {
        editor = $(this);
        if (c == 8) {
            return del(editor);
        } else if (e.metaKey || e.altKey || e.ctrlKey || c == 9 || c == 19 || c == 20 ||
                c >= 33 && c <= 36 || c == 45 || c == 46 || c == 91 || c >= 112 && c <= 123 || c == 145) {
            automaton.reset();
        }
    }
}

function reset() {
    if (inputMode === 'hangul') {
        automaton.reset();
    }
}

function put(editor, keyCode) {
    var s;
    if (automaton.currentBlock !== undefined) {
        s = editor.getSelection();
        editor.setSelection(s.end - 1, s.end);
    }
    if (keyCode == 13) // IE 9 gives 13 for Enter
        keyCode = 10;
    automaton.next(String.fromCharCode(keyCode));
    if (buffer.length > 0) {
        editor.replaceSelectedText(buffer.join(''));
        buffer.length = 0;
    }
    if (automaton.currentBlock !== undefined) {
        editor.replaceSelectedText(automaton.currentBlock);
    }
}

function del(editor) {
    var s;
    if (automaton.currentBlock === undefined) {
        return true;
    } else {
        s = editor.getSelection();
        editor.setSelection(s.end - 1, s.end);
        automaton.next('\b');
        if (automaton.currentBlock === undefined) {
            editor.deleteSelectedText();
        } else {
            editor.replaceSelectedText(automaton.currentBlock);
        }
        return false;
    }
}

$.hangulime = hangulime;

})(jQuery, hangul);
