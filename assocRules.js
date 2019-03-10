const combinations = require('./utils/optimization').combinations;

class AssocRules {
  /**
   * @param {!Array<Array>} data
   * @param {!Number} [minSupp]
   * @param {!Number} [minConf]
   */
  constructor(data, minSupp = 0.7, minConf = 0.7) {
    this.data = data;
    this.minSupp = minSupp;
    this.minConf = minConf;
  }

  /**
   * @return {Array<{attrs: Array<Number>, attr: Number, conf: Number, supp: Number}>} rules
   */
  run() {
    const rules = [];
    const nAttrs = this.data[0].length;
    const attributes = Array(nAttrs).fill(0).map((_, idx) => idx);
    for (let i = 2; i <= nAttrs; i++) {
      for (const attrComb of combinations(attributes, i)) {
        // #rows that have all of the attributes in attrComb / #rows
        const supp = this.data.filter(row => attrComb.map(a => !!row[a]).reduce((b1, b2) => b1 && b2, true)).length / this.data.length;
        if (supp < this.minSupp) break;
        for (const attr of attrComb) {
          const otherAttrs = attrComb.filter(a => a !== attr);
          const conf = this.data.filter(row => row[attr] && otherAttrs.map(a => !!row[a]).reduce((b1, b2) => b1 && b2, true)).length / this.data.filter(row => !!row[attr]).length;
          if (conf >= this.minConf) {
            rules.push({attrs: otherAttrs, attr, supp, conf})
          }
        }
      }
    }
    return rules;
  }
}

module.exports = AssocRules;
