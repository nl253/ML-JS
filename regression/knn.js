/**
 * TODO KNN with string features d(a, b) == a != b
 * TODO r cannot be 1.0
 */
const { Regressor } = require('./index');
const { toTypedArray, sampleWOR, getTypedArray, arange } = require('../utils');


class KNN extends Regressor {
  /**
   * @param {!DF} data
   * @param {Array<*>} labels
   * @param {!Number} k
   * @param {!Number} nReprs
   * @param {?Array<!Number>|?TypedArray} [weights]
   * @param {?Array<!Number>|?TypedArray} reprs
   * @param reprPerLabel
   */
  constructor(data, labels, r = 0.1, k = 3, nReprs = null, weights = null, reprs = null, reprPerLabel = 12) {
    /*
     * KNN does not need any training data but some parts of the api require non-empty training data frame
     * so include exactly 1 example in the data frame
     */
    super(data, labels, r);

    // number of neighbours
    this.k = k;

    // default to weight of 1 for all dimensions
    this.weights = weights === null ? getTypedArray('Float64', this.dataTrain.nCols).fill(1) : toTypedArray(weights);

    // max number of data points to look at
    this._nReprs = nReprs === null ? Math.min(this.dataTrain.length, this.uniqueLabels.length * reprPerLabel) : nReprs;

    this.reprs = reprs === null ? this._randRepr : reprs;
  }

  /**
   * @returns {!TypedArray}
   * @private
   */
  get _randRepr() {
    return sampleWOR(arange(this.dataTrainCount), this._nReprs);
  }

  /**
   * Find weights that maximise score.
   *
   * @param {!Number} [delta]
   * @param {!Number} minImprove
   * @private
   */
  _guessWeights(delta = 0.1, minImprove = 0.0001) {
    for (let colIdx = 0; colIdx < this.dataTrain.nCols; colIdx++) {
      let oldScore = this.score - 0.1;
      let improvement;
      do {
        const newScore = this.score;
        improvement = newScore - oldScore;
        this.weights[colIdx] += delta * improvement;
        oldScore = newScore;
      } while (improvement >= minImprove);
    }
  }

  fit(n = 200) {
    let bestScore = this.score;
    let bestPop = this.reprs;

    for (let i = 0; i < n; i++) {
      this.reprs = this._randRepr;
      const s = this.score;
      if (s > bestScore) {
        bestPop = this.reprs;
        bestScore = s;
      }
    }

    this.reprs = bestPop;
  }

  /**
   * @param {Array<Number>} x
   * @returns {*} prediction
   */
  predict(x) {
    const { dataTrain } = this;
    const bestIdx = getTypedArray('Uint32', this.k);
    const bestD = getTypedArray('Float64', this.k).fill(Infinity);

    for (const rowIdx of this.reprs) {
      let d = 0;
      for (let colIdx = 0; colIdx < dataTrain.nCols; colIdx++) {
        d += ((dataTrain.val(colIdx, rowIdx) - x[colIdx]) ** 2) * this.weights[colIdx];
      }
      for (let i = bestD.length - 1; i >= 0; i--) {
        if (d < bestD[i]) {
          bestD[i] = d;
          bestIdx[i] = rowIdx;
          break;
        }
      }
    }

    return mean(Array.from(bestIdx).map(idx => this.labelsTrain[idx]));
  }
}

module.exports = KNN;
