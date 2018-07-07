# ArrayUtils

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

## Installation

`$ npm install ml-array-utils`

## Methods

### coordArrayToPoints(array, dimensions) 

Function that returns an array of points given 1D array as follows:

`[x1, y1, .. , x2, y2, ..]`

And receive the number of dimensions of each point.

### uniqueX(xs, ys)

In place modification of the 2 arrays to make X unique and sum the Y if X has the same value

 * @param xs
 * @param ys

And receive the number of dimensions of each point.


__Arguments__

* `array` - 1D array
* `dimensions` - number of dimensions that has each point.

### coordArrayToCoordMatrix(array, dimensions) 

Function that given an array as follows:

`[x1, y1, .. , x2, y2, ..]`

Returns an array as follows:

`[[x1, x2, ..], [y1, y2, ..], [ .. ]]`

And receives the number of dimensions of each coordinate.

__Arguments__

* `array` - 1D array
* `dimensions` - number of dimensions that has each point.

### coordMatrixToCoordArray(coordMatrix)

Function that receives a coordinate matrix as follows:

`[[x1, x2, ..], [y1, y2, ..], [ .. ]]`

Returns an array of coordinates as follows:

`[x1, y1, .. , x2, y2, ..]`

__Arguments__

* `coordMatrix` - Coordinate matrix

### coordMatrixToPoints

Function that receives a coordinate matrix as follows:

`[[x1, x2, ..], [y1, y2, ..], [ .. ]]`

Returns an array of points.

__Arguments__

* `coordMatrix` - Coordinate matrix

### pointsToCoordArray(points)

Function that transform an array of points into a coordinates array as follows:

`[x1, y1, .. , x2, y2, ..]`

__Arguments__

* `points` - Coordinate matrix

### pointsToCoordMatrix(points)

Function that recieve an array of points and returns a coordinates matrix as follows:

`[[x1, x2, ..], [y1, y2, ..], [ .. ]]`

__Arguments__

* `points` - Coordinate matrix

### applyDotProduct(firstVector, secondVector)

Apply the dot product between the smaller vector and a subsets of the
largest one, returns an array with all the results of each dot product.

__Arguments__

* `firstVector` - Array
* `secondVector` - Array

### getEquallySpacedData(x, y, options)

Function that returns a Number array of equally spaced numberOfPoints
containing a representation of intensities of the spectra arguments x
and y.

The options parameter contains an object in the following form:
from: starting point
to: last point
numberOfPoints: number of points between from and to
variant: "slot" or "smooth" - smooth is the default option

The slot variant consist that each point in the new array is calculated
averaging the existing points between the slot that belongs to the current
value. The smooth variant is the same but takes the integral of the range
of the slot and divide by the step size between two points in the new array.

__Arguments__

* `x` - Array of positions in the x axis.
* `y` - Array of positions in the y axis.
* `options` - Options in the way described.

### SNV(data)

Function that applies the standard normal variate (SNV) to an array of values.

__Arguments__

* `data` - array of values.

## Authors

- [Jefferson Hernandez](https://github.com/JeffersonH44)

## License

[MIT](./LICENSE)
  
[npm-image]: https://img.shields.io/npm/v/ml-array-utils.svg?style=flat-square
[npm-url]: https://npmjs.org/package/ml-array-utils
[travis-image]: https://img.shields.io/travis/mljs/array-utils/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/mljs/array-utils
[david-image]: https://img.shields.io/david/mljs/array-utils.svg?style=flat-square
[david-url]: https://david-dm.org/mljs/array-utils
[download-image]: https://img.shields.io/npm/dm/ml-array-utils.svg?style=flat-square
[download-url]: https://npmjs.org/package/ml-array-utils