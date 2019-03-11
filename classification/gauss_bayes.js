const mean = require('../utils/stats').mean;
const transpose = require('../utils').transpose;
const Classifier = require('./index').Classifier;

class GaussBayes extends Classifier {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   */
  constructor(data, labels) {
    super(data, labels);
    this.uniqueLabels = Array.from(new Set(labels));

    this.groups = {};
    let i = 0;
    for (let rows of this.uniqueLabels.map(l => data.filter((_, idx) => labels[idx] === l))) {
      this.groups[this.uniqueLabels[i]] = rows;
      i++;
    }

    this.mu = {};
    i = 0;
    for (let mus of this.uniqueLabels.map((_, l) => transpose(this.groups[l]).map(col => mean(col)))) {
      this.mu[this.uniqueLabels[i]] = mus;
      i++;
    }

    i = 0;
    this.cov = {};
    for (const l of this.uniqueLabels) {
      this.cov[l] = {};
      for (const l2 of this.uniqueLabels.filter(l3 => l3 !== l)) {
        let sum = 0;
        for (let i = 0; i < this.data.length; i++) {
          sum += this.groups[l][i] - this.mu[l][i]
        }
        this.cov[l][l2] =
            this.groups[l].map(row => (row - this.mu[l]) * (this.groups[l])) * this.groups[l2].map(row => (row - this.mu[l]) * (this.groups[l2])) / this.groups[l].length;
        // this.groups[l].length
      }
    }

    //[].concat(this.uniqueLabels).map(l => transpose(this.groups[l]).map() );
    // this.cov = Array(data[0].length).fill(0).map((_, row) => Array(data[0].fill(0)).map((_, col) => data.map().reduce() / data.length));
  }

  pCgivenX(x) {
    return -1/2 * (transpose(x.map(v => v - this.mu))) *
  }

  predict(x) {
    return argMax();
  }
}

module.exports = GaussBayes;
