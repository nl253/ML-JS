const {Classifier} = require('.');

module.exports = class NaiveBayes extends Classifier {

  /**
   *
   * @param {Array<Array>} data
   * @param {Array} labels
   */
  constructor(data, labels) {
    super(data, labels);

    /**
     * Unique label values for the predicted attribute.
     *
     * @type {Array}
     */
    this.labelVals = Array.from(new Set(labels));

    /**
     * Counts of unique label values for the predicted attribute.
     *
     * @type Object<Number>
     */
    this.labelValsPS = {};
    for (const variant of this.labelVals) {
      this.labelValsPS[variant] = this.labels.filter(l => l === variant).length / this.labels.length;
    }

    /** @type Object<Object<Object<Number>>> */
    this.attrCounts = {};
    /** @type Object<Object<Object<Number>>> */
    this.attrPS = {};
    for (const variant of this.labelVals) {
      this.attrCounts[variant] = {};
      this.attrPS[variant] = {};
      for (let col = 0; col < this.data[0].length; col++) {
        this.attrCounts[variant][col] = {};
        this.attrPS[variant][col] = {};
      }
    }

    for (let row = 0; row < this.data.length; row++) {
      for (let col = 0; col < this.data[0].length; col++) {
        this.attrCounts[this.labels[row]][col][this.data[row][col]] =
            (this.attrCounts[this.labels[row]][col][this.data[row][col]] || 0) +
            1;
      }
    }

    for (const variant of this.labelVals) {
      for (let col = 0; col < this.data[0].length; col++) {
        for (const val of Object.keys(this.attrCounts[variant][col])) {
          this.attrPS[variant][col][val] =
              this.attrCounts[variant][col][val] /
              Object.values(this.attrCounts[variant][col]).
                  reduce((left, right) => left + right);
        }
      }
    }
  }

  /**
   * @param {Array<*>} x input vector (data point)
   * @returns {*} predicted class name
   */
  predict(x) {
    return this.labelVals
        .map(variant => [
          variant,
          x.map((val, idx) => this.attrPS[variant][idx][val]
              ? this.attrPS[variant][idx][val]
              : 0)
          .reduce((a, b) => a * b, 1) * this.labelValsPS[variant]])
        .reduce((pair1, pair2) => pair1[1] > pair2[1] ? pair1 : pair2)[0];
  }
};
