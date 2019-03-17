const {Classifier} = require('.');
const Tree = require('./randTree');
const Ensemble = require('./ensemble');

class RandForest extends Classifier {
  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [nTrees]
   */
  constructor(data, labels, r = 0.1, nTrees = 20) {
    super(data, labels);
    this.nTrees = nTrees;
    this.r = r;
  }

  /**
   * Learn the models.
   */
  fit() {
    this.ensemble = new Ensemble(
      this.data,
      this.labels,
      this.r,
      Array(this.nTrees).fill(0).map(_ => this._randTree));
    this.ensemble.fit();
  }

  /**
   * @return {function(*=, *=): RandTree} tree supplier
   */
  get _randTree() {
    return (data, labels) => new Tree(data, labels, this.r);
  }

  /**
   * @return {!Number} score
   */
  get score() {
    return this.ensemble.score;
  }

  /**
   * @param {*} x
   * @return {*} prediction
   */
  predict(x) {
    return this.ensemble.predict(x);
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
