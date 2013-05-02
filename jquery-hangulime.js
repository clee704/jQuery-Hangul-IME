/**
 * jQuery Hangul IME
 * https://github.com/clee704/jQuery-Hangul-IME
 * Depends on:
 *   jQuery (http://jquery.com/)
 *   hangul.js, hangul-dubeol.js, hangul-sebeol.js (https://github.com/clee704/hangul-js)
 *   rangyinputs_jquery.js (http://code.google.com/p/rangyinputs)
 * @version 0.2.1
 * @copyright Copyright 2013, Choongmin Lee
 * @license MIT license
 */
(function ($, hangul, undefined) {

var buffer = [],
    automata = {
      dubeol: new hangul.dubeol.Automaton(buffer),
      sebeol: new hangul.sebeol.Automaton(buffer)
    },
    automaton = automata.dubeol,
    inputMode = 'hangul';

var methods = {
  init: function (options) {
    return this.each(function () {
      var $this = $(this),
          data = $this.data('hangulime');
      if (!data) {
        var config = $.extend({
              // TODO default options
            }, options),
            listeners = {
              'keypress.hangulime': keypress,
              'keydown.hangulime': keydown,
              'mousedown.hangulime': reset,
              'blur.hangulime': reset
            };
        $this.data('hangulime', {
          config: config
        }).bind(listeners);
      }
    });
  },
  destroy: function () {
    return this.each(function () {
      var $this = $(this),
          data = $this.data('hangulime');
      if (data) {
        $this.unbind('.hangulime').removeData('hangulime');
      }
    });
  }
};

$.fn.hangulime = function (method) {
  if (methods[method]) {
    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
  } else if (typeof method === 'object' || !method) {
    return methods.init.apply(this, arguments);
  } else {
    $.error('Method ' + method + ' does not exist on jQuery.hangulime');
  }
};

var KEY_CODE = {
  BACKSPACE: 8,
  TAB: 9,
  RETURN: 13,
  PAUSE_BREAK: 19,
  CAPS_LOCK: 20,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40,
  INSERT: 45,
  DELETE: 46,
  LEFT_WINDOWS: 91,
  RIGHT_WINDOWS: 92,
  RIGHT_COMMAND: 93,
  F1: 112,
  F12: 123,
  SCROLL_LOCK: 145,
  IME: 229
}

function keypress(e) {
  var $this = $(this),
      c = e.which;
  // In Firefox, special keys also trigger keypress events; so filter them
  if (e.metaKey || e.altKey || e.ctrlKey ||
      e.shiftKey && c == KEY_CODE.SPACE || c == KEY_CODE.IME ||
      c == 0 || c == KEY_CODE.BACKSPACE || c == KEY_CODE.TAB ||
      c == KEY_CODE.PAUSE_BREAK || c == KEY_CODE.CAPS_LOCK ||
      c == KEY_CODE.SCROLL_LOCK) {
    return;
  }
  if (inputMode === 'hangul') return put($this, e.which);
}

function keydown(e) {
  var $this = $(this),
      c = e.which;
  if (e.altKey && e.shiftKey && c == KEY_CODE.SPACE) {
    changeAutomaton();
    return false;
  } else if (e.shiftKey && c == KEY_CODE.SPACE || c == KEY_CODE.IME) {
    changeInputMode();
    return false;
  } else if (inputMode === 'hangul') {
    if (c == KEY_CODE.BACKSPACE) {
      return del($this);
    } else if (e.metaKey || e.altKey || e.ctrlKey ||
        c == KEY_CODE.TAB || c == KEY_CODE.PAUSE_BREAK ||
        c == KEY_CODE.CAPS_LOCK || c == KEY_CODE.INSERT ||
        c == KEY_CODE.DELETE || c == KEY_CODE.LEFT_WINDOWS ||
        c == KEY_CODE.RIGHT_WINDOWS || c == KEY_CODE.SCROLL_LOCK ||
        c >= KEY_CODE.PAGE_UP && c <= KEY_CODE.DOWN_ARROW ||
        c >= KEY_CODE.F1 && c <= KEY_CODE.F12) {
      automaton.reset();
    }
  }
}

function reset() {
  if (inputMode === 'hangul') automaton.reset();
}

function changeInputMode() {
  inputMode = (inputMode === 'hangul') ? 'qwerty' : 'hangul';
  automaton.reset();
}

function changeAutomaton() {
  automaton = (automaton === automata.dubeol) ?
      automata.sebeol : automata.dubeol;
  automaton.reset();
}

function put($this, keyCode) {
  var useNativePutter = false;
  if (automaton.currentBlock !== undefined) {
    var s = $this.getSelection();
    $this.setSelection(s.end - 1, s.end);
    if ($this.getSelection().text !== automaton.currentBlock) {
      $this.setSelection(s.start, s.end);
    }
  }
  if (keyCode == KEY_CODE.RETURN) {
    keyCode = 10;
  }
  var ch = String.fromCharCode(keyCode);
  automaton.next(ch);
  if (buffer.length > 0) {
    if (buffer[buffer.length - 1] === ch &&
        automaton.currentBlock === undefined) {
      buffer.pop();
      useNativePutter = true;
    }
    $this.replaceSelectedText(buffer.join(''));
    buffer.length = 0;
    if (useNativePutter) {
      return;
    }
  }
  if (automaton.currentBlock !== undefined) {
    $this.replaceSelectedText(automaton.currentBlock);
  }
  return false;
}

function del($this) {
  if (automaton.currentBlock === undefined) {
    return true;
  } else {
    var s = $this.getSelection();
    $this.setSelection(s.end - 1, s.end);
    automaton.next('\b');
    if (automaton.currentBlock === undefined) {
      $this.deleteSelectedText();
    } else {
      $this.replaceSelectedText(automaton.currentBlock);
    }
    return false;
  }
}

})(jQuery, hangul);
