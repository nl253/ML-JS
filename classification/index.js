class Classifier {
  /**
   * @param {Array<Array<*>>} xs
   * @param {Array<*>} ys
   * @param {Number} r
   */
  constructor(xs, ys, r = 0.1) {
    this.testCount = Math.floor(xs.length * r);
    this.data = xs.slice(0, this.testCount);
    this.testData = xs.slice(this.testCount);
    this.labels = ys.slice(0, this.testCount);
    this.testLabels = ys.slice(this.testCount);
  }

  /**
   * @return {Number} accurracy score in [0, 1]
   */
  score() {
    return this.testData.filter((x, idx) => this.predict(x) === this.testLabels[idx]) / this.testLabels.length;
  }

  /**
   * @param {Array<*>} x
   * @return {*} prediction
   */
  predict(x) {
    return console.warn('predict(x) needs to be overridden');
  }
}

module.exports = {
  knn: require('./knn'),
  naive_bayes: require('./naive_bayes'),
  Classifier,
};
