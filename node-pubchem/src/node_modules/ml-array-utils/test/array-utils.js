'use strict';

var ArrayUtils = require('..');

describe('Array Utilities', function () {
    it('1D array to points', function () {
        var array = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];

        var result = ArrayUtils.coordArrayToPoints(array, 3);

        (result[1][0]).should.be.equal(2);
        (result[1][1]).should.be.equal(2);
        (result[1][2]).should.be.equal(2);
    });
    
    it('1D array to Coordinate Matrix', function () {
        var array = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];

        var result = ArrayUtils.coordArrayToCoordMatrix(array, 3);

        (result[0][0]).should.be.equal(1);
        (result[1][1]).should.be.equal(2);
        (result[2][2]).should.be.equal(3);
    });

    it('Coordinate Matrix to 1D array', function () {
        var mat = [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]];

        var result = ArrayUtils.coordMatrixToCoordArray(mat);

        result[0].should.be.equal(1);
        result[5].should.be.equal(2);
        result[12].should.be.equal(4);
    });

    it('Coordinate Matrix to Points', function () {
        var mat = [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]];

        var result = ArrayUtils.coordMatrixToPoints(mat);

        (result[1][0]).should.be.equal(2);
        (result[1][1]).should.be.equal(2);
        (result[1][2]).should.be.equal(2);
    });

    it('Points to 1D array', function () {
        var mat = [[1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3], [4, 4, 4, 4]];

        var result = ArrayUtils.pointsToCoordArray(mat);

        result[0].should.be.equal(1);
        result[5].should.be.equal(2);
        result[12].should.be.equal(4);
    });

    it('Points to Coordinate Matrix', function () {
        var mat = [[1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3], [4, 4, 4, 4]];

        var result = ArrayUtils.pointsToCoordMatrix(mat);

        (result[0][0]).should.be.equal(1);
        (result[1][1]).should.be.equal(2);
        (result[2][2]).should.be.equal(3);
    });

    it('Apply dot product for each element', function () {
        var first = [1, 2, 3, 4, 5];
        var second = [1, 2, 3];

        var result = ArrayUtils.applyDotProduct(first, second);

        result[0].should.be.equal(14);
        result[1].should.be.equal(20);
        result[2].should.be.equal(26);

        // it should work independent of the arguments
        result = ArrayUtils.applyDotProduct(second, first);

        result[0].should.be.equal(14);
        result[1].should.be.equal(20);
        result[2].should.be.equal(26);
    });

    it('Scale vector inplace and not-inplace', function () {
        var first = [1, 2, 3, 4, 5];

        var result = ArrayUtils.scale(first, {min:-1});
        first[0].should.be.equal(1);
        result[0].should.be.equal(-1);

        var result = ArrayUtils.scale(first, {max:2});
        first[0].should.be.equal(1);
        result[0].should.be.equal(2/5);
        result[4].should.be.equal(2);

        var result = ArrayUtils.scale(first, {min:-1,max:2});
        first[0].should.be.equal(1);
        result[0].should.be.equal(-1);
        result[4].should.be.equal(2);

        var result = ArrayUtils.scale(first, {min:-1,max:2, inPlace:true});
        first[0].should.be.equal(-1);
        first[4].should.be.equal(2);
        result[0].should.be.equal(-1);
        result[4].should.be.equal(2);

        first = [1, 2, 3, 4, 5];
        var result = ArrayUtils.scale(first, {min:-1,max:2, inPlace:false});
        first[0].should.be.equal(1);
        first[4].should.be.equal(5);
        result[0].should.be.equal(-1);
        result[4].should.be.equal(2);
    });

    it('Scale vector negative and positive', function () {
        var first = [-1, 0, 3, 4, 5];

        var result = ArrayUtils.scale(first, {min:0, max: 6, inPlace:true});
        result.should.eql([0, 1, 4, 5, 6]);
        first[0].should.be.equal(0);
        first[first.length-1].should.be.equal(6);
    });
});
