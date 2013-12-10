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

  this.players = [];

  this.generatePlayers(2);

  this.generateBoard(3);
}

Game.prototype.render = function () {
  var ret = this.template.render(this);

  pend(this.template.rendered[0]).prepend(this.board.render());

  return ret;
};

/**
 * Create players for the game
 * @param  {Number} n Number of players to create
 */
Game.prototype.generatePlayers = function (n) {
  for(var i=0; i<n; i++) {
    this.players.push({
      name: "Player "+(i+1),
      turn: !i,
      turnClass: function () {
        return this.turn ? "turn" : "";
      }
    });
  }
};


Game.prototype.generateBoard = function (n) {
  this.board = new Board(n);
};