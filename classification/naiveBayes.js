const argMax = require('../utils').argMax;
const { Classifier } = require('.');

class NaiveBayes extends Classifier {
  /**
   * @param {!DF} data
   * @param {Array<*>} labels
   * @param {!Number} [r]
   */
  constructor(data, labels, r = 0.1) {
    super(data, labels, r);
  }

  /**
   * Learn the model.
   */
  fit() {
    const labelIdxs = this.labels.map(l => this.uniqueLabels.findIndex(label => label === l));

    this._classPS = {};
    for (let lIdx = 0; lIdx < this.uniqueLabels.length; lIdx++) {
      this._classPS[lIdx] = labelIdxs.filter(index => index === lIdx).length / labelIdxs.length;
    }

    /** @type Object<Object<Object<Number>>> */
    this.counts = Array(this.uniqueLabels.length).fill(0);

    for (let lIdx = 0; lIdx < this.uniqueLabels.length; lIdx++) {
      this.counts[lIdx] = Array(this.data.nCols).fill(0);
      for (let col = 0; col < this.data.nCols; col++) {
        this.counts[lIdx][col] = {};
      }
    }

    const data = this.dataTrain;

    for (let row = 0; row < this.dataTrainCount; row++) {
      for (let col = 0; col < this.data.nCols; col++) {
        const val = data.val(col, row);
        const lIdx = labelIdxs[row];
        this.counts[lIdx][col][val] = (this.counts[lIdx][col][val] || 0) + 1;
      }
    }

    for (let lIdx = 0; lIdx < this.uniqueLabels.length; lIdx++) {
      for (let col = 0; col < this.data.nCols; col++) {
        const total = Object.values(this.counts[lIdx][col]).reduce((left, right) => left + right);
        for (const val of Object.keys(this.counts[lIdx][col])) {
          this.counts[lIdx][col][val] /= total;
        }
      }
    }

    this._ps = this.counts;
    delete this.counts;
  }

  /**
   * @param {Array<*>} row input vector (data point)
   * @returns {*} predicted class name
   */
  predict(row) {
    // for unseen values assume uniform probability distribution where every value in a feature has the same p
    // so when you see a new value, assume the probability is (1 / (all seen features) + 1)
    const idx = argMax(
      this.uniqueLabels.map((_, idx) => idx),
      lIdx => row
        .map((val, colIdx) => {
          return this._ps[lIdx][colIdx][val] || 1/ (this._ps[lIdx][colIdx].length + 1)
          // return this._ps[lIdx][colIdx][val] || 0;
        })
        .reduce((a, b) => a * b, 1) * this._classPS[lIdx]);
    return this.uniqueLabels[idx];
  }

  toString() {
    return `${this.name} { ${this._classPS === undefined ? '' : 'acc = ' + this.score + ' '}#data = ${this.dataTrainCount}, r = ${this.r} }`;
  }
}

module.exports = NaiveBayes;
