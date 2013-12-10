/**
 * Dependencies
 */
var Oz = require('oz')
  , pend = require('pend')
  , Board = require('board')
  , gameTemplate = require('./template');


/**
 * Export constructor
 */
module.exports = Game;

function Game() {
  this.template = Oz(gameTemplate);

  this.inProgress = true;

  this.generatePlayers(2);

  this.generateBoard(3);
}

Game.prototype.gameOver = function () {
  return !this.inProgress;
};

Game.prototype.render = function () {
  var ret = this.template.render(this);

  pend(this.template.rendered[0]).prepend(this.board.render());

  return ret;
};

Game.prototype.update = function () {
  this.template.update(this);
  this.board.update();
};

/**
 * Create players for the game
 * @param  {Number} n Number of players to create
 */
Game.prototype.generatePlayers = function (n) {
  this.players = [];

  for(var i=0; i<n; i++) {
    this.players.push({
      name: (!i ? 'X' : 'O') + "'s",
      turn: !i,
      turnClass: function () {
        return this.turn ? "turn" : "";
      },
      symbol: !i ? 'X' : 'O',
      cells: []
    });

    if(!i) this.turn = this.players[i];
  }
};


Game.prototype.generateBoard = function (n) {
  var game = this
    , board = this.board = new Board(n);

  this.board.on('select', function (cell) {
    var player = game.turn;

    board.grid[cell.x][cell.y].player = player;
    player.cells.push(cell);

    game.checkForVictory();

    game.nextTurn();

    game.update();
  });
};

Game.prototype.nextTurn = function () {
  var i = this.players.indexOf(this.turn);
  this.turn.turn = false;
  this.turn = this.players[i+1] || this.players[0];
  this.turn.turn = true;
};


Game.prototype.checkForVictory = function () {
  if(this.isCatGame()) {
    this.inProgress = false;
    this.draw = true;

    return;
  }

  this.winner = this.hasWinner();

  if(this.winner) this.inProgress = false;
};

Game.prototype.isCatGame = function () {
  var grid = this.board.grid;

  for(var x=0; x<grid.length; x++) {
    for(var y=0; y<grid[x].length; y++) {
      if(!grid[x][y].player) return false;
    }
  }

  return true;
};

Game.prototype.hasWinner = function () {
  var grid = this.board.grid
    , size = grid.length
    , player;

  for(var i=0; i<this.players.length; i++) {
    player = this.players[i];

    // min 3 cells to win
    if(player.cells.length < 3) continue;

    if(hasColumn(player.cells, size)) return player;

    if(hasRow(player.cells, size)) return player;

    if(hasDiagonal(player.cells, size)) return player;
  }

  return false;
};

function hasColumn(cells, size) {
  for(var y=0; y<size; y++) {
    for(var x=0; x<size; x++) {
      if(!findCell(x, y , cells)) break;
      if(x === (size-1)) return true;
    }
  }
}

function hasRow(cells, size) {
  for(var x=0; x<size; x++) {
    for(var y=0; y<size; y++) {
      if(!findCell(x, y , cells)) break;
      if(y === (size-1)) return true;
    }
  }
}

function hasDiagonal(cells, size) {
  // top left to bottom right
  for(var i=0; i<size; i++) {
    if(!findCell(i, i, cells)) break;
    if(i === (size-1)) return true;
  }

  // bottom left to top right
  for(i=0; i<size; i++) {
    if(!findCell(size - 1 - i, i, cells)) break;
    if(i === (size-1)) return true;
  }

  return false;
}

function findCell(x, y, cells) {
  for(var i=0; i<cells.length; i++) {
    if(cells[i].x === x && cells[i].y === y) return cells[i];
  }

  return false;
}