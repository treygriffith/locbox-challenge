var Oz = require('oz')
  , Emitter = require('emitter')
  , attr = require('attr')
  , boardTemplate = require('./template');


module.exports = Board;


function Board(n) {
  var board = this;

  this.template = Oz(boardTemplate);

  this.template.on('select', function (el, e, ctx) {
    // let the game know that a cell was selected
    var x = parseInt(attr(el).get('data-x'), 10)
      , y = parseInt(attr(el).get('data-y'), 10);

    board.emit('select', {x: x, y: y});
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
      this.grid[x][y] = new Cell(x, y, i);
      i++;
    }
  }
};

Board.prototype.render = function () {
  return this.template.render(this);
};

Board.prototype.update = function () {
  this.template.update(this);
};


function Cell(x, y, i) {
  this.x = x;
  this.y = y;
  this.i = i;
  this.player = false;
}

Cell.prototype.contents = function () {
  return this.player ? this.player.symbol : "";
};