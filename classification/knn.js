/**
 * TODO KNN with string features d(a, b) == a != b
 */
const {Classifier} = require('./index');
const {majorityVote} = require('../utils');
const {randNArrEls} = require('../utils/random');
const log = require('../utils/log');
const GA = require("../search/genetic");


class KNN extends Classifier {
  /**
   * @param {!DF} data
   * @param {Array<*>} labels
   * @param {!Number} [r]
   * @param {!Number} k
   * @param {'guess'|!Array<!Number>} [weights]
   * @param {!Number} [maxSample]
   * @param {?Boolean} [doPrune]
   */
  constructor(data, labels, k = 3, weights = 'guess', maxSample = 150, doPrune = true) {
    super(data, labels, 0.9);
    this.k = k;

    // max number of data points to look at
    this.maxSample = Math.min(this.dataTrainCount, maxSample);

    // initialise reprs to the indexes of the first maxSample candidates
    this.reprs = Array(this.maxSample).fill(1).map((_, idx) => idx);

    // default to weight of 1 for all dimensions
    this.weights = new Float64Array(new ArrayBuffer(this.data.nCols * 8)).fill(1);

    if (weights === 'guess') {
      log.debug(`guessing weights ... (this might take a while)`);
      this.weights = this._guessWeights();
      log.debug(`guessed weights: [${this.weights.join(', ')}]`);
    } else if (weights !== null) {
      this.weights = weights;
    }

    if (doPrune) this.reprs = this._chooseReprs();
  }

  _guessWeights() {
    const goodWeights = [1.65, 1, 1.85, 5, 0.75, 2, 1.25, 4.25];
    const searchAttrsNo = Math.min(this.data.nCols, 10);
    /**
     * @param {!Number} n
     * @return {!Float64Array} weights
     */
    const decode = (n) => {
      const a = new Float64Array(new ArrayBuffer(8 * this.data.nCols)).fill(1);
      for (let i = 0; i < searchAttrsNo; i++) {
        // 3 bits for each are enough to encode values from 0..8 (hence array of 8 good weights)
        a[i] = goodWeights[n & 0b111];
        n >>= 3;
      }
      return a;
    };
    /**
     * @param {!Number} n
     * @return {!Number} fitness
     */
    const fitness = n => {
      this.weights = decode(n);
      return this.score;
    };
    const ga = new GA(fitness, 15, 100000, 300);
    return decode(ga.search()[0]);
  }

  _chooseReprs(nRuns = 200) {
    const pops = [];

    for (let i = 0; i < nRuns; i++) {
      const pop = randNArrEls(Array(this.dataTrainCount).fill(0).map((_, idx) => idx), this.maxSample);
      this.reprs = pop;
      const score = this.score;
      pops.push({ score, pop })
    }

    const sortF = ({score: s1}, {score: s2}) => {
      if (s1 > s2) return -1;
      else if (s1 < s2) return 1;
      else return 0;
    };

    return pops.sort(sortF)[0].pop;
  }

  fit() {
    log.warn(`fitting not needed for ${this.name}`);
  }

  /**
   * @param {Array<Number>} x
   * @return {*} prediction
   */
  predict(x) {
    const data = this.dataTrain;
    let ds = [];

    // const sample = this.

    for (const rowIdx of this.reprs) {
      let d = 0;
      for (let colIdx = 0; colIdx < data.nCols; colIdx++) {
        d += ((data.val(colIdx, rowIdx) - x[colIdx])**2) * this.weights[colIdx];
      }
      ds.push({ d: Math.sqrt(d), l: this.labelsTrain[rowIdx] });
    }

    // sort ASC
    ds = ds.sort(({d: d1}, {d: d2}) => {
      if (d1 > d2) return 1;
      else if (d1 < d2) return -1;
      else return 0;
    });

    return majorityVote(ds.slice(0, this.k).map(o => o.l));
  }
}

module.exports = KNN;
