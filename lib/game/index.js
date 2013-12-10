console.log("game loaded 2");
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

  this.generatePlayers(2);

  this.generateBoard(3);
}

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
      name: "Player "+(i+1),
      turn: !i,
      turnClass: function () {
        return this.turn ? "turn" : "";
      },
      symbol: !i ? 'X' : 'O'
    });

    if(!i) this.turn = this.players[i];
  }
};


Game.prototype.generateBoard = function (n) {
  var game = this
    , board = this.board = new Board(n);

  this.board.on('select', function (cell) {
    var player = game.turn;

    board.grid[cell.x][cell.y].contents = player.symbol;

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

};