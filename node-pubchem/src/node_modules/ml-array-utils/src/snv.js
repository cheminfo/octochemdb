'use strict';

exports.SNV = SNV;
var Stat = require('ml-stat').array;

/**
 * Function that applies the standard normal variate (SNV) to an array of values.
 *
 * @param data - Array of values.
 * @returns {Array} - applied the SNV.
 */
function SNV(data) {
    var mean = Stat.mean(data);
    var std = Stat.standardDeviation(data);
    var result = data.slice();
    for (var i = 0; i < data.length; i++) {
        result[i] = (result[i] - mean) / std;
    }
    return result;
}
