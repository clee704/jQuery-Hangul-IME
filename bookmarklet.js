(function () {
  var win = this,
      doc = this.document,
      loadingJQuery = false,
      src = {
        //jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js',
        //hangulime: 'https://raw.github.com/clee704/jQuery-Hangul-IME/master/jquery-hangulime-standalone.min.js'
        jquery: 'http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js',
        hangulime: 'http://clee704.github.io/jQuery-Hangul-IME/jquery-hangulime-standalone.min.js'
      };
  function loadScript(url, callback) {
    var head = doc.getElementsByTagName("head")[0],
        script = doc.createElement("script"),
        done = false;
    script.src = url;
    script.onload = script.onreadystatechange = function () {
      if (!done && (!this.readyState || this.readyState == "loaded" ||
                    this.readyState == "complete")) {
        done = true;
        callback();
        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
        head.removeChild(script);
      }
    };
    head.appendChild(script);
  }
  function compareVersion(v1, v2) {
    var a1 = v1.split('.'),
        a2 = v2.split('.'),
        n = a1.length,
        m = a2.length;
    for (var i = 0; i < n && i < m; ++i) {
      var x = parseInt(a1[i]);
      var y = parseInt(a2[i]);
      if (x < y) {
        return -1;
      } else if (x > y) {
        return 1;
      }
    }
    return n < m ? -1 : n > m ? 1 : 0;
  }
  function setup() {
    var $,
        jQuery;
    if (win._hangulime_jQuery) {
      $ = win.$;
      jQuery = win.jQuery;
      win.$ = win.jQuery = win._hangulime_jQuery;
    }
    win.jQuery('textarea, input[type="text"]').hangulime();
    if (loadingJQuery && !win._hangulime_jQuery) {
      loadingJQuery = false;
      win._hangulime_jQuery = win.jQuery.noConflict(true);
    }
    if ($) {
      win.$ = $;
      win.jQuery = jQuery;
    }
  }
  function loadHangulIme() {
    loadScript(src.hangulime, setup);
  }
  if (win._hangulime_jQuery) {
    setup();
  } else if (win.jQuery && compareVersion(win.jQuery.fn.jquery, '1.4.3') > 0) {
    if (win.jQuery.hangulime) {
      setup();
    } else {
      loadHangulIme();
    }
  } else {
    loadingJQuery = true;
    loadScript(src.jquery, loadHangulIme);
  }
})();
