console.log("game loaded 2");
/**
 * Dependencies
 */
var Oz = require('oz')
  , gameTemplate = require('./template');


/**
 * Export constructor
 */
module.exports = Game;

function Game() {
  this.template = Oz(gameTemplate);

  this.players = [];

  this.generatePlayers(2);
}

Game.prototype.render = function () {
  return this.template.render(this);
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