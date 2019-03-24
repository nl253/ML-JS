const log = require('../utils/log');
const arange = require('../utils').arange;
const mean = require('../utils').mean;
const { toTypedArray } = require('../utils');


class Classifier {
  /**
   * @param {!DF} data
   * @param {Array<*>} labels
   * @param {Number} [r]
   */
  constructor(data, labels, r = 0.1) {
    this.data = data;
    this.labels = labels;
    this.uniqueLabels = toTypedArray(Array.from(new Set(labels)));
    this.r = r;
    this.cv = Math.floor(1 / this.r);
    this.fold = 1;
  }

  /**
   * @returns {!Number} number of rows in training data
   */
  get dataTrainCount() {
    return this.data.length - this.dataTestCount;
  }

  /**
   * @returns {!Number} number of rows in testing data
   */
  get dataTestCount() {
    return Math.floor(this.data.length * this.r);
  }

  /**
   * @returns {!Array<*>|!TypedArray} labels for the test data
   */
  get labelsTest() {
    return this.labels.slice(
      this.dataTestCount * (this.fold - 1),
      this.dataTestCount * (this.fold),
    );
  }

  /**
   * @returns {!Array<*>} labels for the training data
   */
  get labelsTrain() {
    return this.labels
      .slice(0, (this.fold - 1) * this.dataTestCount)
      .concat(this.labels.slice(this.fold * this.dataTestCount, this.labels.length));
  }

  /**
   * @returns {!DF} testing data
   */
  get dataTest() {
    return this.data.slice(
      this.dataTestCount * (this.fold - 1),
      this.dataTestCount * (this.fold),
    );
  }

  /**
   * @returns {!DF} training data
   */
  get dataTrain() {
    return this.data
      .slice(0, (this.fold - 1) * this.dataTestCount)
      .concat(this.data.slice(this.fold * this.dataTestCount, this.data.length));
  }

  /**
   * @returns {!String} name
   */
  get name() {
    return this.constructor.name;
  }

  /**
   * Initialise (learn) the model.
   */
  fit() {
    throw new Error('Model.fit() needs to be overridden');
  }

  /**
   * @return {!Number}
   */
  get scoreCV() {
    const folds = arange(this.cv - 1).cast('Float64');
    console.log(folds);
    return folds.map(idx => {
      const m = new this.constructor(this.data, this.labels, this.r);
      m.fold = idx + 1;
      console.log(`#data = ${this.data.length}, #train = ${m.dataTrainCount}, #test = ${m.dataTestCount}, ${m.fold}/${m.cv}`);
      const { score } = m;
      return score;
    }).mean;
  }

  /**
   * @returns {Number} accuracy score in [0, 1]
   */
  get score() {
    return this.dataTest.filter((row, idx) => this.predict(row) === this.labelsTest[idx]).length / this.dataTestCount;
  }

  /**
   * @param {Array<*>} row
   * @returns {*} prediction
   */
  predict(row) {
    return log.warn('Model.predict(row) needs to be overridden');
  }

  /**
   * @returns {!Classifier} clone of the classifier
   */
  clone(copyData = false) {
    const copy = new this.constructor(copyData ? this.data.clone() : this.data, copyData ? [].concat(this.labels) : this.labels, this.r);
    for (const k of Object.keys(this)) {
      copy[k] = this[k];
    }
    return copy;
  }

  toString() {
    return `${this.name} { #features = ${this.data.nCols}, ${this.uniqueLabels.length <= 5 ? `uniqueLabels = [${this.uniqueLabels.join(', ')}]` : `#uniqueLabels = ${this.uniqueLabels.length}`}, #dataTrain = ${this.dataTrainCount}, #dataTest = ${this.dataTestCount}, r = ${this.r} }`;
  }
}

module.exports = { Classifier };
