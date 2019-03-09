class Classifier {
  /**
   * @param {Array<Array<*>>} data
   * @param {Array<*>} labels
   * @param {Number} r
   */
  constructor(data, labels, r = 0.1) {
    this.testCount = Math.floor(data.length * r);
    this.testData = data.slice(0, this.testCount);
    this.data = data.slice(this.testCount, data.length);
    this.testLabels = labels.slice(0, this.testCount);
    this.labels = labels.slice(this.testCount, data.length);
  }

  /**
   * @return {Number} accuracy score in [0, 1]
   */
  score() {
    return this.testData.filter((x, idx) => this.predict(x) === this.testLabels[idx]) / this.testCount;
  }

  /**
   * @param {Array<*>} x
   * @return {*} prediction
   */
  predict(x) {
    return console.warn('predict(x) needs to be overridden');
  }
}

module.exports = {Classifier};
