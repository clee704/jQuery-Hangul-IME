/*!
 * jQuery Hangul IME 0.1.2
 *
 * Copyright 2011, Choongmin Lee
 * Licensed under the MIT license.
 *
 * Depends on:
 *     hangul.inputmethods.js (https://github.com/clee704/hangul-js)
 *     textinputs_jquery.js (http://code.google.com/p/rangyinputs)
 */
(function ($, hangul, window, undefined) {

var settings = {},
    buffer = [],
    automata = {
        dubeol: new hangul.dubeol.Automaton(buffer),
        sebeol: new hangul.sebeol.Automaton(buffer)
    },
    automaton = automata.dubeol,
    inputMode = 'hangul';

function hangulime(newSettings) {
    if (newSettings === undefined) {
        newSettings = {};
    }
    setStatusLabel(newSettings.statusLabel);
    setLayoutSelector(newSettings.layoutChooser);
    setEditor(newSettings.editor);
}

function setStatusLabel(statusLabel) {
    if (settings.statusLabel) {
        $(settings.statusLabel).unbind('click', changeInputMode);
        if (settings.statusLabel === '#hangulime-statuslabel') {
            $('#hangulime-statuslabel').remove();
        }
    }
    if (statusLabel === undefined) {
        statusLabel = '#hangulime-statuslabel';
        $('<button/>', {
            id: 'hangulime-statuslabel',
            title: 'Shift+Space',
            css: {
                border: '1px solid #666',
                padding: '0.25em 0',
                width: '2em',
                fontSize: '15px',
                fontWeight: 'bold',
                textAlign: 'center',
                position: 'fixed',
                right: '1em',
                bottom: '3em',
                opacity: 0.67,
                zIndex: 10000
            }
        }).appendTo('body');
    }
    settings.statusLabel = statusLabel;
    if (statusLabel) {
        $(statusLabel).click(changeInputMode).text(inputMode === 'hangul' ? '\ud55c' : 'A');
    }
}

function setLayoutSelector(layoutChooser) {
    var e,
        layout;
    if (settings.layoutChooser) {
        $(layoutChooser).unbind('click', layoutChanged);
        if (settings.layoutChooser === 'input[name=hangulime-layoutchooser]') {
            $('#hangulime-layoutchooser').remove();
        }
    }
    if (layoutChooser === undefined) {
        layoutChooser = 'input[name=hangulime-layoutchooser]';
        e = $('<div/>', {
            id: 'hangulime-layoutchooser',
            css: {
                position: 'fixed',
                right: '1em',
                bottom: '1em',
                opacity: 0.67,
                zIndex: 10000
            }
        });
        $('<input/>', {
            type: 'radio',
            name: 'hangulime-layoutchooser',
            value: 'dubeol',
            checked: 'checked'
        }).prependTo($('<label>\ub450\ubc8c\uc2dd</label>').appendTo(e));
        $('<input/>', {
            type: 'radio',
            name: 'hangulime-layoutchooser',
            value: 'sebeol'
        }).prependTo($('<label>\uc138\ubc8c\uc2dd</label>').appendTo(e));
        e.appendTo('body');
    }
    settings.layoutChooser = layoutChooser;
    if (layoutChooser) {
        $(layoutChooser).click(layoutChanged);
        layout = $(layoutChooser + ':checked').val();
        if (layout in automata) {
            automaton = automata[layout];
            automaton.reset();
        }
        // IE 9 bug fix
        $(window.document).ready(function () {
            layout = $(layoutChooser + ':checked').val();
            if (layout in automata) {
                automaton = automata[layout];
                automaton.reset();
            }
        });
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
        $(settings.editor).unbind(listeners);
    }
    if (editor === undefined) {
        editor = 'textarea, input[type=text]';
    }
    settings.editor = editor;
    if (editor) {
        $(editor).bind(listeners);
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
    var layout = $(this).val();
    if (layout in automata) {
        automaton = automata[layout];
        automaton.reset();
    }
}

function keypress(e) {
    var c = e.which;
    // In Firefox, special keys also trigger keypress events; so filter them
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey && (c == 32 || c == 229) ||
            c == 0 || c == 8 || c == 9 || c == 19 || c == 20 || c == 145) {
        return;
    }
    if (inputMode === 'hangul') {
        return put($(this), e.which);
    }
}

function keydown(e) {
    var c = e.which,
        editor;
    if (e.shiftKey && (c == 32 || c == 229)) {
        changeInputMode();
        return false;
    } else if (inputMode === 'hangul') {
        editor = $(this);
        if (c == 8) {
            return del(editor);
        } else if (e.metaKey || e.altKey || e.ctrlKey || c == 9 || c == 19 || c == 20 ||
                c >= 33 && c <= 40 || c == 45 || c == 46 || c == 91 || c >= 112 && c <= 123 || c == 145) {
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
    var s,
        ch,
        useNativePutter = false;
    if (automaton.currentBlock !== undefined) {
        s = editor.getSelection();
        editor.setSelection(s.end - 1, s.end);
        if (editor.getSelection().text !== automaton.currentBlock) {
            editor.setSelection(s.start, s.end);
        }
    }
    if (keyCode == 13) { // IE 9 gives 13 for Enter
        keyCode = 10;
    }
    ch = String.fromCharCode(keyCode);
    automaton.next(ch);
    if (buffer.length > 0) {
        if (buffer[buffer.length - 1] === ch && automaton.currentBlock === undefined) {
            buffer.pop();
            useNativePutter = true;
        }
        editor.replaceSelectedText(buffer.join(''));
        buffer.length = 0;
        if (useNativePutter) {
            return;
        }
    }
    if (automaton.currentBlock !== undefined) {
        editor.replaceSelectedText(automaton.currentBlock);
    }
    return false;
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

})(jQuery, hangul, window);
