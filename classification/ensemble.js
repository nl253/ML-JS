const argMax = require('../utils').argMax;
const {mean} = require('../utils/stats');
const {shuffle} = require('../utils');

/**
 * @param {!Array<*>} preds
 * @return {*} prediction
 */
function majorityVote(preds) {
  const index = {};
  for (let p = 0; p < preds.length; p++) {
    index[preds[p]] = (index[preds[p]] || 0) + 1;
  }
  return argMax(Object.keys(index), label => index[label]);
}

class Ensemble {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Array<Function>} [ensemble]
   * @param {!Number} [r]
   * @param {!Function} [aggScore]
   * @param {!Function} [aggPred]
   */
  constructor(data, labels, r = 0.2, ensemble, aggScore = mean, aggPred = majorityVote) {
    this.data = data;
    this.labels = labels;
    this.ensemble = ensemble;
    this.aggScore = aggScore;
    this.aggPred = aggPred;
    this.r = r;
  }

  /**
   * @return {Number} accuracy score in [0, 1]
   */
  score() {
    return this.aggScore(this.ensemble.map((c, idx) => {
      const s = c.score();
      console.info(`Score(${c.toString()}) = ${s}`);
      return s;
    }));
  }

  /**
   * Initialise (learn) the model.
   */
  fit() {
    this.ensemble = [].concat(this.ensemble).concat(this.ensemble);
    for (let c = 0; c < this.ensemble.length; c++) {
      let xs = [].concat(this.data);
      let ys = [].concat(this.labels);
      const joint = ys.map((y, idx) => [xs[idx], y]);
      shuffle(joint);

      xs = [];
      ys = [];

      for (const pair of joint) {
        xs.push(pair[0]);
        ys.push(pair[1]);
      }

      const model = this.ensemble[c](xs, ys);
      model.fit();
      this.ensemble[c] = model;
    }

    this.ensemble = this.ensemble.sort((a, b) => {
      const aS = a.score();
      const bS = b.score();
      if (aS > bS) return -1;
      else if (bS > aS) return 1;
      else return 0;
    }).slice(0, this.ensemble.length / 2);
  }

  /**
   * @param {Array<*>} x
   * @return {*} prediction
   */
  predict(x) {
    return this.aggPred(this.ensemble.map(c => c.predict(x)));
  }

  /**
   * @return {!String} string representation of the object
   */
  toString() {
    return `${this.constructor.name} { ${this.ensemble.map(c => c.toString()).join(', ')} }`;
  }
}

module.exports = Ensemble;
