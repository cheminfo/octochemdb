'use strict';

module.exports = {
  minMass: 0.5,
  maxMass: 1000.5,
  stepMass: 25,
  allowedElements: ['H', 'C', 'O', 'N', 'S', 'P', 'F', 'Cl', 'Br'],
  elementRatios: [
    'C/H',
    'C/N',
    'C/O',
    'C/S',
    'C/P',
    'C/FClBr',
    'O/P',
    'O/S',
    'CCNP/HFClBr',
  ],
  ratioMinValue: -8,
  ratioMaxValue: 8,
  ratioSlotWidth: 0.2,
  ratioPenality: 0.8,
  weighted: false,
  randomSamples: 2,
  sampleMin: 450.5,
  sampleMax: 500.5,
  samplePpm: [0.1, 0.5, 1, 5, 10, 50, 100],
  sampleMfRange: 'C1-100 H0-202 N0-50 O0-50 F0-25 S0-25 Cl0-25 Br0-25 P0-25',
};
