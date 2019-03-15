const {toTypedArray, transpose: t} = require('./utils');
const {mean, variance, mad, median, nQuart} = require('./utils/stats');

class DF {
  /**
   * @param {DF|Object<Array<*>>|Array<*>|Array<Array<*>>} data
   * @param {'cols'|'rows'|'dict'} [what]
   * @param {?Array<!String>} [colNames]
   */
  constructor(data = [], what = 'rows', colNames = null) {
    // accept data in 3 modes:
    // - list of columns Array<Array<*>>,
    // - list of rows <Array<Array<*>>,
    // - Object<*, Array<*>> (dict key => col)
    if (data.length === 0) {
      this.cols = [];
      this.colNames = [];
    } else if (data.constructor.name === this.constructor.name) {
      this.cols = [].concat(data.cols);
      this.colNames = [].concat(data.colNames)
    } else if (what === 'dict') {
      this.cols = Object.values(data).map(toTypedArray);
      this.colNames = Object.keys(data);
    } else {
      this.cols = what === 'rows' ? t(data).map(toTypedArray) : data.map(toTypedArray);
      this.colNames  = colNames ? colNames : Array(this.noCols).fill(0).map((_, idx) => idx);
    }

    const attrNames = new Set(this.colNames);
    // index using cols integers AND column names
    Array(this.noCols).fill(0).map((_, idx) => attrNames.add(idx));

    // easy access e.g. df.age, df.salary
    for (let name of attrNames) {
      Object.defineProperty(this, name, { get: function () { return this.col(name); } });
    }

    // make this.rowIter a getter
    Object.defineProperty(this, 'rowIter', {get: function*  () {
        for (let r = 0; r < this.noRows; r++) yield this.row(r);
      }});
  }

  /**
   * @param {!String|!Number} nameOrIdx
   * @return {Array<String>|TypedArray} column
   */
  col(nameOrIdx) {
    if (nameOrIdx.constructor.name === 'String') {
      return this.col(this.colNames.findIndex(name => name === nameOrIdx));
    } else return this.cols[nameOrIdx];
  }

  /**
   * @return {!Number} selects a number
   */
  value(colNameOrIdx, idx) {
    return this.col(colNameOrIdx)[idx];
  }

  /**
   * @param {!Number} idx
   * @return {!Array<*>} row
   */
  row(idx) {
    const r = [];
    for (let col = 0; col < this.noCols; col++) {
      r.push(this.value(col, idx));
    }
    return r;
  }

  /**
   * @return {!Number} number of columns
   */
  get noCols() {
    return this.cols.length;
  }

  /**
   * @return {!Number} number of rows
   */
  get noRows() {
    return this.cols[0].length;
  }

  /**
   * @return {{rows: !Number, cols: !Number}}
   */
  get dim() {
    return {rows: this.noRows, cols: this.noCols};
  }

  /**
   * @return {!Array<!String>} data types for all columns
   */
  get dtype() {
    return this.cols.map(c => c.constructor.name.replace('Array', ''));
  }

  /**
   * @param {Array<*>} row
   */
  appendRow(row) {
    for (let col = 0; col < row.length; col++) {
      this.col(0).push(row[col]);
    }
  }

  /**
   * @param {!Array<!String>|!Array<!Number>} col
   * @param {?String} [name]
   */
  appendCol(col, name = null) {
    this.cols.push(toTypedArray(col));
    const colName = name ? name : this.noCols;
    Object.defineProperty(this, colName, { get: function () { return this.col(colName); } });
    this.colNames.push(colName);
  }

  /**
   * @param {DF} df other data frame
   */
  mergeDF(df) {
    for (let c = 0; c < df.colNames.length; c++) {
      this.appendCol(df.col(c), df.colNames[c]);
    }
  }

  /**
   * @param {!Number} [n]
   * @return {!DF} data frame
   */
  head(n = 50) {
    return this.peek(0, n);
  }

  /**
   * @param {!Number} [n]
   * @return {!DF} data frame
   */
  tail(n = 50) {
    return this.peek(this.noRows - n, this.noRows);
  }

  /**
   * @param {!Number} [n]
   * @param {!Number} [m]
   * @return {!DF} data frame
   */
  peek(n = 50, m = 100) {
    return new DF(this.cols.map(c => c.slice(n, m)), 'cols', this.colNames);
  }

  /**
   * Summaries each column.
   *
   * @return {DF} data frame
   */
  get summary() {
    const info = {
      column: [],
      min: [], max: [], range: [],
      mean: [],
      stdev: [], variance: [], mad: [],
      Q1: [], median: [], Q3: [],
      dtype: [],
    };
    for (let c = 0; c < this.colNames.length; c++) {
      const name = this.colNames[c];
      const min = this.col(c).reduce((v1, v2) => Math.min(v1, v2));
      const max = this.col(c).reduce((v1, v2) => Math.max(v1, v2));
      const v = variance(this.col(c));
      info.column.push(name);
      info.mean.push(mean(this.col(c)));
      info.dtype.push(this.dtype[c]);
      info.variance.push(v);
      info.stdev.push(Math.sqrt(v));
      info.Q1.push(nQuart(this.col(c), 1, 4));
      info.median.push(median(this.col(c)));
      info.Q3.push(nQuart(this.col(c), 3, 4));
      info.min.push(min);
      info.max.push(max);
      info.mad.push(mad(this.col(c)));
      info.range.push(max - min);
    }
    return new DF(info, 'dict');
  }

  /**
   * @return {!Object<Array<!Number>|!Array<!String>>} dictionary
   */
  toDict() {
    const dict = {};
    for (let c = 0; c < this.cols.length; c++) {
      dict[this.colNames[c]] = Array.from(this.col(c));
    }
    return dict;
  }

  /**
   * @return {!Array<Array<*>>} rows or cols as array
   */
  toArray(mode = 'rows') {
    return mode === 'rows' ? Array.from(this.rowIter) : this.cols.map(c => Array.from(c));
  }

  /**
   * @param {!Number} [n]
   * @param {!Number} [m]
   */
  print(n = 0, m = 20) {
    const tabularData = Array.from(this.rowIter).slice(n, m).map(row => {
      const dict = {};
      for (let v = 0; v < row.length; v++) {
        dict[this.colNames[v]] = row[v];
      }
      return dict;
    });
    console.table(tabularData);
  }

  toString() {
    return `DataFrame ${this.noCols}x${this.noRows} { ${this.dtype.map((dt, idx) => this.colNames[idx] + ' ' + dt)} }`;
  }
}

module.exports = DF;
