const log = require('../utils/log');

class Classifier {
  /**
   * @param {!DF} data
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
    return this.data.noCols;
  }

  /**
   * @return {!Number} number of rows in training data
   */
  get dataTrainCount() {
    return this.data.noRows - this.dataTestCount;
  }

  /**
   * @return {!Number} number of rows in testing data
   */
  get dataTestCount() {
    return Math.floor(this.data.noRows * this.r);
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
   * @return {!DF} testing data
   */
  get dataTest() {
    return this.data.sliceRows(0, this.dataTestCount, true);
  }

  /**
   * @return {!DF} training data
   */
  get dataTrain() {
    return this.data.sliceRows(this.dataTestCount, null, true);
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
    return this.dataTest.filterRows((row, idx, _) => this.predict(row) === this.labelsTest[idx]).length / this.dataTestCount;
  }

  /**
   * @param {Array<*>} row
   * @return {*} prediction
   */
  predict(row) {
    return log.warn('Model.predict(row) needs to be overridden');
  }

  toString() {
    return `${this.constructor.name} { #features = ${this.featureCount}, #uniqueLables = ${this.uniqueLabels.length}, #dataTrain = ${this.dataTrainCount}, #dataTest = ${this.dataTestCount}, r = ${this.r} }`;
  }
}

module.exports = {Classifier};
