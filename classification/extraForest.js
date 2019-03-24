const { Classifier } = require('.');
const Tree = require('./extraTree');
const { majorityVote } = require('../utils');

class ExtraForest extends Classifier {
  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [nTrees]
   */
  constructor(data, labels, r = 0.1, nTrees = 100) {
    super(data, labels);
    this.nTrees = nTrees;
    this.r = r;
  }

  /**
   * Learn the models.
   */
  fit() {
    this.trees = [];
    for (let i = 0; i < this.nTrees; i++) {
      const t = new Tree(this.dataTrain, this.labelsTrain);
      t.fit();
      this.trees.push(t);
    }
  }

  /**
   * @param {Array<*>} x
   * @return {*} prediction
   */
  predict(x) {
    return majorityVote(this.trees.map(t => t.predict(x)));
  }

  toString() {
    return `${this.name} { #tres = ${this.nTrees} }`;
  }
}

module.exports = ExtraForest;
