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
    /**
     * Counts of unique label values for the predicted attribute.
     *
     * @type Object<Number>
     */
    this.labelValsPS = {};
    for (const variant of this.uniqueLabels) {
      this.labelValsPS[variant] = this.labels.filter(l => l === variant).length / this.labels.length;
    }

    /** @type Object<Object<Object<Number>>> */
    this.attrCounts = {};
    /** @type Object<Object<Object<Number>>> */
    this.attrPS = {};
    for (const variant of this.uniqueLabels) {
      this.attrCounts[variant] = {};
      this.attrPS[variant] = {};
      for (let col = 0; col < this.data.nCols; col++) {
        this.attrCounts[variant][col] = {};
        this.attrPS[variant][col] = {};
      }
    }

    const data = this.dataTrain;

    for (let row = 0; row < this.dataTrainCount; row++) {
      for (let col = 0; col < this.data.nCols; col++) {
        this.attrCounts[this.labels[row]][col][data.col(col)[row]] =
          (this.attrCounts[this.labels[row]][col][data.col(col)[row]] || 0) + 1;
      }
    }

    for (const variant of this.uniqueLabels) {
      for (let col = 0; col < this.data.nCols; col++) {
        for (const val of Object.keys(this.attrCounts[variant][col])) {
          this.attrPS[variant][col][val] =
            this.attrCounts[variant][col][val] /
            Object.values(this.attrCounts[variant][col]).reduce((left, right) => left + right);
        }
      }
    }
  }

  /**
   * @param {Array<*>} row input vector (data point)
   * @returns {*} predicted class name
   */
  predict(row) {
    return this.uniqueLabels.map(label => [
        label,
        row.map((val, idx) => this.attrPS[label][idx][val]
          ? this.attrPS[label][idx][val]
          : 0)
          .reduce((a, b) => a * b, 1) * this.labelValsPS[label]])
      .reduce(([v1, p1], [v2, p2]) => p1 > p2 ? [v1, p1] : [v2, p2])[0];
  }

  toString() {
    return `${this.name} { ${this.labelValsPS !== undefined ? 'acc = ' + this.score + ' ' : ''}#data = ${this.dataTrainCount}, r = ${this.r} }`;
  }
}

module.exports = NaiveBayes;
