const log = require('../utils/log');

class Classifier {
  /**
   * @param {Array<Array<*>>} data
   * @param {Array<*>} labels
   * @param {Number} [r]
   */
  constructor(data, labels, r = 0.1) {
    this.r = r;
    this.data = data;
    this.labels = labels;
    this.uniqueLabels = Array.from(new Set(labels));
  }

  /**
   * @return {!Number} number of features in each data point
   */
  get featureCount() {
    return this.data[0].length;
  }

  /**
   * @return {!Number} number of rows in training data
   */
  get dataTrainCount() {
    return this.data.length - this.dataTestCount;
  }

  /**
   * @return {!Number} number of rows in testing data
   */
  get dataTestCount() {
    return Math.floor(this.data.length * this.r);
  }

  /**
   * @return {!Array<*>} labels for the test data
   */
  get labelsTest() {
    return this.labels.slice(0, this.dataTestCount);
  }

  /**
   * @return {!Array<*>} labels for the training data
   */
  get labelsTrain() {
    return this.labels.slice(this.dataTestCount);
  }

  /**
   * @return {!Array<*>} testing data
   */
  get dataTest() {
    return this.data.slice(0, this.dataTestCount);
  }

  /**
   * @return {!Array<*>} training data
   */
  get dataTrain() {
    return this.data.slice(this.dataTestCount);
  }

  get name() {
    return this.constructor.name;
  }

  /**
   * Initialise (learn) the model.
   */
  fit() {
    return log.warn('Model.fit() needs to be overridden');
  }

  /**
   * @return {Number} accuracy score in [0, 1]
   */
  score() {
    return this.dataTest.filter((x, idx) => this.predict(x) === this.labelsTest[idx]).length / this.dataTestCount;
  }

  /**
   * @param {Array<*>} x
   * @return {*} prediction
   */
  predict(x) {
    return log.warn('Model.predict(x) needs to be overridden');
  }

  toString() {
    return `${this.constructor.name} { #features = ${this.featureCount}, #uniqueLables = ${this.uniqueLabels.length}, #dataTrain = ${this.dataTrain.length}, #dataTest = ${this.dataTest.length}, r = ${this.r} }`;
  }
}

module.exports = {Classifier};
