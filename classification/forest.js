const {Classifier} = require('.');
const {randInRange} = require('../utils/random');
const Tree = require('./randTree');
const Ensemble = require('./ensemble');

class Forest extends Classifier {
  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} [n]
   * @param {!Array<!Number>} [leafItemsBounds]
   * @param {!Array<!Number>} [purityBounds]
   * @param {?Array<!Number>} [depthBounds]
   */
  constructor(
      data,
      labels,
      r = 0.1,
      n = 20,
      leafItemsBounds = [3, 10],
      purityBounds = [0.79, 0.95],
      depthBounds = null) {
    super(data, labels);
    this.depthBounds = depthBounds === null ? [this.featureCount * 2,  this.featureCount * 5] : depthBounds;
    this.leafItemsBounds = leafItemsBounds;
    this.n = n;
    this.purityBounds = purityBounds;
    this.r = r;
  }

  fit() {
    this.ensemble = new Ensemble(
        this.data,
        this.labels,
        this.r,
        Array(this.n).fill(0).map(_ => this.randTreeSupplier()));
    this.ensemble.fit();
  }

  /**
   * @return {function(*=, *=): RandTree} tree supplier
   */
  randTreeSupplier() {
    return (data, labels) => new Tree(
        data,
        labels,
        this.r,
        Math.floor(randInRange(this.leafItemsBounds[0], this.leafItemsBounds[1])),
        randInRange(this.purityBounds[0], this.purityBounds[1]),
        Math.floor(randInRange(this.depthBounds[0], this.depthBounds[1])),
    );
  }

  score() {
    return this.ensemble.score();
  }

  /**
   * @param {*} x
   * @return {*} prediction
   */
  predict(x) {
    return this.ensemble.predict(x);
  }
}

module.exports = Forest;
