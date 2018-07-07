'use strict';

var integral = require('../src/getEquallySpaced').integral;
var getEquallySpacedData = require('..').getEquallySpacedData;

describe('get equally spaced data', function () {

    it('should compute integral with a,b, x0 and x1', function () {
        integral(0, 1, 1, 0).should.equal(0.5);
        integral(0, 3, 1, 0).should.equal(4.5);
        integral(0, 3, 1, 1).should.equal(7.5);
        integral(0, 3, 1, 2).should.equal(10.5);
        integral(0, 3, 1, -1).should.equal(1.5);
        integral(0, 3, 1, -2).should.equal(-1.5);
        integral(0, 3, -1, 0).should.equal(-4.5);
        integral(-1, 3, -1, 0).should.equal(-4);
    });

    it('getEquallySpacedData smooth', function () {
        var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        var ans = getEquallySpacedData(x, y, {
            from: 1,
            to: 3,
            numberOfPoints: 3
        });

        ans[0].should.be.equal(1);
        ans[1].should.be.equal(2);
        ans[2].should.be.equal(3);

        ans = getEquallySpacedData(x, y, {
            from: 0.5,
            to: 2.5,
            numberOfPoints: 3
        });

        ans[0].should.be.equal(0.5);
        ans[1].should.be.equal(1.5);
        ans[2].should.be.equal(2.5);

        ans = getEquallySpacedData(x, y, {
            from: 9.5,
            to: 11.5,
            numberOfPoints: 3
        });

        ans[0].should.be.equal(9.5);
        ans[1].should.be.equal(5);
        ans[2].should.be.equal(0);
    });

    it('getEquallySpacedData slot', function () {
        var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        var ans = getEquallySpacedData(x, y, {
            from: 0,
            to: 10,
            numberOfPoints: 3,
            variant: "slot"
        });

        ans[0].should.be.equal(1);
        ans[1].should.be.equal(5);
        ans[2].should.be.equal(9);

        var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        var ans = getEquallySpacedData(x, y, {
            from: -5,
            to: 15,
            numberOfPoints: 5,
            variant: "slot"
        });

        ans[0].should.be.equal(0);
        ans[1].should.be.equal(1);
        ans[2].should.be.equal(5);
        ans[3].should.be.equal(9);
        ans[4].should.be.equal(0);


        var x = [0, 5, 10];
        var y = [0, 5, 10];

        var ans = getEquallySpacedData(x, y, {
            from: 0,
            to: 10,
            numberOfPoints: 5,
            variant: "slot"
        });

        ans[0].should.be.equal(0);
        ans[1].should.be.equal(0);
        ans[2].should.be.equal(5);
        ans[3].should.be.equal(0);
        ans[4].should.be.equal(10);

        x = [0, 5, 10];
        y = [0, 5, 10];

        var ans = getEquallySpacedData(x, y, {
            from: 0,
            to: 10,
            numberOfPoints: 2,
            variant: "slot"
        });

        ans[0].should.be.equal(2.5);
        ans[1].should.be.equal(10);

        x = [10, 5, 0];
        y = [10, 5, 0];

        var ans = getEquallySpacedData(x, y, {
            from: 0,
            to: 10,
            numberOfPoints: 2,
            variant: "slot"
        });

        ans[0].should.be.equal(2.5);
        ans[1].should.be.equal(10);
        
        

        x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        y = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0];
        ans = getEquallySpacedData(x, y, {
            from: 4,
            to: 6,
            numberOfPoints: 3,
            variant: "slot"
        });

        ans[0].should.be.equal(4);
        ans[1].should.be.equal(5);
        ans[2].should.be.equal(4);
    });

    it('changing from and to', function () {
        var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        var y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        var ans = getEquallySpacedData(x, y, {
            from: 6,
            to: 3,
            numberOfPoints: 4,
            variant: "smooth"
        });

        ans[0].should.be.equal(6);
        ans[1].should.be.equal(5);
        ans[2].should.be.equal(4);
        ans[3].should.be.equal(3);
    });

    describe('on jcamp data', function () {
        var data = require('./data/jcamp.json');
        var x = data.x;
        var y = data.y;
        
        it('inbound', function () {
            var ans = getEquallySpacedData(x, y, {
                from: 100,
                to: 1500,
                numberOfPoints: 1000
            });
            ans.map(x => x.should.not.be.NaN());
        });

        it('out of bounds start', function () {
            var ans = getEquallySpacedData(x, y, {
                from: 0,
                to: 1500,
                numberOfPoints: 1000
            });
            ans.map(x => x.should.not.be.NaN());
        });

        it('out of bounds end', function () {
            var ans = getEquallySpacedData(x, y, {
                from: 1000,
                to: 4500,
                numberOfPoints: 1000
            });
            ans.map(x => x.should.not.be.NaN());
        });

        it('completely out of bounds', function () {
            var ans = getEquallySpacedData(x, y, {
                from: 3000,
                to: 4500,
                numberOfPoints: 1000
            });
            ans.map(x => x.should.equal(0));
        });
    });

});
