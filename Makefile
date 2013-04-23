sources = jquery-hangulime.js bookmarklet.js
minified = $(sources:.js=.min.js)
lib = lib/hangul.js lib/hangul-dubeol.js lib/hangul-sebeol.js lib/rangyinputs_jquery.js
lib_minified = $(lib:.js=.min.js)
combined = jquery-hangulime-standalone.min.js

combine: $(combined)

$(combined): $(lib_minified) jquery-hangulime.min.js
	cat $^ > $(combined)

min: $(minified)

$(minified): %.min.js: %.js
	uglifyjs $< -o $@ -m --comments --lint

init:
	npm install -g uglify-js

server:
	python -m SimpleHTTPServer

.PHONY: min combine init server
