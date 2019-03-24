const { mean, majorityVote, shuffle } = require('../utils');
const log = require('../utils/log');
const DF = require('../DF');

class Ensemble {
  /**
   * @param {!DF} data
   * @param {!Array<*>} labels
   * @param {!Array<Function>} [ensemble] array of functions (data, labels, r) => new Classifier(data, labels, r, ...);
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
   * @returns {Number} accuracy score in [0, 1]
   */
  get score() {
    return this.aggScore(this.ensemble.map(c => c.score));
  }

  /**
   * Initialise (learn) the model.
   */
  fit() {
    // train more classifiers and then select best
    const classifiers = [];
    const noClassifiers = Math.floor(this.ensemble.length * 1.5);
    // const noTrainingData = Math.floor(this.data.length * (1 - this.r));
    const noTrainingData = this.data.length;

    for (let c = 0; c < noClassifiers; c++) {
      const iter = this.data.slice(0, noTrainingData).rowIter;
      const jointWithLabels = Array(noTrainingData).fill(0).map((_, idx) => {
        const row = iter.next().value;
        row.push(this.labels[idx]);
        return row;
      });

      // reorder the data so that each classifier is a bit different
      shuffle(jointWithLabels);

      const data = new DF(jointWithLabels, 'rows', this.data.colNames.slice(0, this.data.colNames.length - 1));
      const xs = data.sliceCols(0, data.nCols - 1);
      const ys = data.col(data.nCols - 1);

      const model = this.ensemble[c % this.ensemble.length](xs, ys, this.r);

      model.fit();
      classifiers.push(model);
      log.info(`finished training ${model.toString()}`);
    }

    this.ensemble = classifiers
      // compute scores only once, then compare them
      .map(c => ({ c, score: c.score }))
      // sort DESCENDING
      .sort(({ c: c1, score: score1 }, { c: c2, score: score2 }) => {
        if (score1 > score2) return -1;
        else if (score1 < score2) return 1;
        else return 0;
      })
      // get top best
      .slice(0, this.ensemble.length)
      // drop score
      .map(({ c }) => c);
  }

  /**
   * @param {Array<*>} x
   * @returns {*} prediction
   */
  predict(x) {
    return this.aggPred(this.ensemble.map(c => c.predict(x)));
  }

  /**
   * @returns {!String} string representation of the object
   */
  toString() {
    return `${this.constructor.name} { ${this.ensemble.map(c => c.toString()).join(', ')} }`;
  }
}

module.exports = Ensemble;
