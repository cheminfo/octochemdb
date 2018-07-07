'use strict';

var SNV = require('..').SNV;

describe('snv normalization', function () {
    it('Main test', function () {
        var data = [0.323, 2.56, 4.67, 13.23];
        var dataNorm = SNV(data);

        dataNorm[0].should.be.approximately(-0.8636, 1e-3);
        dataNorm[1].should.be.approximately(-0.4671, 1e-3);
        dataNorm[2].should.be.approximately(-0.0931, 1e-3);
        dataNorm[3].should.be.approximately(1.4239, 1e-3);
    });
});
