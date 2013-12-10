
build: components index.js locbox-challenge.css
	@component build --dev

components: component.json
	@component install --dev

new:
	rm -fr build
	


clean:
	rm -fr build components

.PHONY: clean
