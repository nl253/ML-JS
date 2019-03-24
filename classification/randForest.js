const { Classifier } = require('.');
const RT = require('./extraTree');
const { majorityVote } = require('../utils');

class RandForest extends Classifier {
  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [nTrees]
   * @param {!Number} [featureRatio]
   */
  constructor(data, labels, r = 0.1, nTrees = 20, featureRatio = 0.3) {
    super(data, labels);
    this.nTrees = nTrees;
    this.r = r;
    this.featureRatio = featureRatio;
  }

  /**
   * Learn the models.
   */
  fit() {
    this.trees = [];
    for (let i = 0; i < this.nTrees; i++) {
      const withLabels = this.dataTrain
        .appendCol(this.labelsTrain)
        .sample(1 / this.nTrees);
      const xs = withLabels.sliceCols(0, -1);
      const ys = withLabels.col(-1);
      const t = new RT(xs, ys);
      t.fit();
      this.trees.push(t);
    }
  }

  /**
   * @param {*} x
   * @return {*} prediction
   */
  predict(x) {
    return majorityVote(this.trees.map(t => t.predict(x)));
  }

  toString() {
    if (this.ensemble[0].constructor.name === 'Function') {
      return `${this.name} { #tres = ${this.nTrees} }`;
    } else {
      return `${this.name} { #tres = ${this.nTrees}, score = ${this.score} }`;
    }
  }
}

module.exports = RandForest;
