var Oz = require('oz')
  , boardTemplate = require('./template');


function Board(n) {
  this.grid = [];

  for(var x=0; x<n; x++) {
    this.grid[x] = [];
    for(var y=0; y<n; y++) {
      this.grid[x][y] = " ";
    }
  }

  this.template = Oz(template);
}

Board.prototype.render = function () {
  return this.template.render(this);
};