const {Classifier} = require('.');

class GaussBayes extends Classifier {

  /**
   * @param {!Array<!Array<*>>} data
   * @param {!Array<*>} labels
   * @param {!Number} [r]
   */
  constructor(data, labels, r = 0.1) {
    super(data, labels, r);
  }

  predict(x) {}
}

module.exports = GaussBayes;
