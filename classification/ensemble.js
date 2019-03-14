const {mean} = require('../utils/stats');
const {shuffle, majorityVote} = require('../utils');
const log = require('../utils/log');

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
    return this.aggScore(this.ensemble.map((c, idx) => c.score()));
  }

  /**
   * Initialise (learn) the model.
   */
  fit() {
    for (let row = 0; row < this.data.length; row++) {
      this.data[row].push(this.labels[row]);
    }

    let classifiers = [];
    const noClassifiers = Math.floor(this.ensemble.length * 1.5);

    for (let c = 0; c < noClassifiers; c++) {
      shuffle(this.data);
      let xs = this.data.map(row => row.slice(0, row.length - 1));
      let ys = this.data.map(row => row[row.length - 1]);
      const model = this.ensemble[c % this.ensemble.length](xs, ys);
      model.fit();
      classifiers.push(model);
      log.info(`finished training ${model}`);
    }

    // sort desc
    this.ensemble = classifiers.sort((c1, c2) => {
      const s1 = c1.score();
      const s2 = c2.score();
      if (s1 > s2) return -1;
      else if (s1 < s2) return 1;
      else return 0;
    }).slice(0, this.ensemble.length);
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
