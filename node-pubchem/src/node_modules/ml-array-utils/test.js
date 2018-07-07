
var gesd = require('./src/getEquallySpaced').getEquallySpacedData;

var x = [0, 4, 8, 12, 16];
var y = [2, 5, 3, -1, 7];

var originalOptions = {
    from: -14,
    to: 28,
    numberOfPoints: 8
};

var options = {
    from: -14,
    to: 28,
    numberOfPoints: 8
};

var result = gesd(x, y, options);

console.log(result.length);
console.log(result);
