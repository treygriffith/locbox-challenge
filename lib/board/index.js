var Oz = require('oz')
  , Emitter = require('emitter')
  , boardTemplate = require('./template');


module.exports = Board;


function Board(n) {
  var board = this;

  this.template = Oz(boardTemplate);

  this.template.on('select', function (el, e, ctx) {
    // let the game know that a cell was selected
  });

  this.generateGrid(n);
}

Emitter(Board.prototype);

Board.prototype.generateGrid = function (n) {

  this.grid = [];

  var i=0;

  for(var x=0; x<n; x++) {
    this.grid[x] = [];
    for(var y=0; y<n; y++) {
      this.grid[x][y] = i;
      i++;
    }
  }
};

Board.prototype.render = function () {
  return this.template.render(this);
};