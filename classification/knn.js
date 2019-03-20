/**
 * TODO KNN with string features d(a, b) == a != b
 * TODO r cannot be 1.0
 */
const { getTypedArray } = require('../utils/arrays');
const { argMax } = require('../utils/math');
const { Classifier } = require('./index');
const { majorityVote } = require('../utils');
const { randNArrEls } = require('../utils/random');


class KNN extends Classifier {
  /**
   * @param {!DF} data
   * @param {Array<*>} labels
   * @param {!Number} k
   * @param {?Array<!Number>|?TypedArray} [weights]
   */
  constructor(data, labels, k = 3, weights = null) {
    // KNN does not need any training data but some parts of the api require non-empty training data frame
    // so include exactly 1 example in the data frame
    super(data, labels, (labels.length - 1)/labels.length);

    // number of neighbours
    this.k = k;

    // max number of data points to look at
    this._maxSample = Math.min(this.data.length, this.uniqueLabels.length * 50);

    // initialise reprs to the indexes of the first _maxSample candidates
    this.reprs = Array(this._maxSample).fill(1).map((_, idx) => idx);

    // default to weight of 1 for all dimensions
    this.weights = new Float64Array(new ArrayBuffer(this.data.nCols * 8)).fill(1);
  }

  _chooseReprs(nRuns) {
    const pops = [];

    for (let i = 0; i < nRuns; i++) {
      const pop = randNArrEls(Array(this.data.length).fill(0).map((_, idx) => idx), this._maxSample);
      this.reprs = pop;
      const score = this.score;
      pops.push({ score, pop })
    }

    const sortF = ({score: s1}, {score: s2}) => s1 > s2 ? -1 : s1 < s2 ? 1 : 0;
    return pops.sort(sortF)[0].pop;
  }

  /**
   * Find weights that maximise score.
   *
   * @return {!Float64Array}
   * @private
   */
  _guessWeights(nRuns, delta = 0.25) {
    const nLoops = Math.ceil(nRuns / this.data.nCols);
    for (let colIdx = 0; colIdx < this.data.nCols; colIdx++) {
      const scores = getTypedArray('Float64', nLoops);
      for (let i = 0; i < nLoops; i++) {
        this.weights[colIdx] = delta * (i + 1);
        scores[i] = this.score;
        if (scores.length >= 2 && scores[scores.length - 1] > scores[scores.length - 2]) {
          break;
        }
      }
      const bestScoreIdx = argMax(scores.map((_, idx) => idx), idx => scores[idx]);
      this.weights[colIdx] = delta * (bestScoreIdx + 1)
    }
  }

  fit(nRuns = 30, minChange = 0.1) {
    let s = this.score;
    let improvement;
    do {
      this._guessWeights(nRuns);
      this.reprs = this._chooseReprs(nRuns);
      improvement = s - this.score;
    } while (improvement >= minChange);
  }

  /**
   * @param {Array<Number>} x
   * @return {*} prediction
   */
  predict(x) {
    const data = this.data;
    let ds = [];

    for (const rowIdx of this.reprs) {
      let d = 0;
      for (let colIdx = 0; colIdx < data.nCols; colIdx++) {
        d += ((data.val(colIdx, rowIdx) - x[colIdx])**2) * this.weights[colIdx];
      }
      ds.push({ d: Math.sqrt(d), l: this.labelsTest[rowIdx] });
    }

    // sort ASC
    ds = ds.sort(({d: d1}, {d: d2}) => d1 > d2 ? 1 : d1 < d2 ? -1 : 0);

    return majorityVote(ds.slice(0, this.k).map(o => o.l));
  }
}

module.exports = KNN;
