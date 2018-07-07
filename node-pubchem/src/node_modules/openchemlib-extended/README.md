# openchemlib-extended

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Openchemlib extended

## DB



## RXN

Create an instance of the RXN object based on a text file in RXN format. This will also calculate for each reagent and product:
* SMILES
* Molecular formula
* Molecular weight
* idCode

```
var rxn = new RXN(rxnFile)
```

methods on rxn:
* addReagent(molfile)
* addProduct(molfile)
* toRXN() : create a new RXN file


## Molecule extension

### getGroupedDiastereotopicAtomIDs(options)

Returns an array containing all the different diastereotopic atoms in the molecule with the occurence of each of them.
It may be useful to first create the implicit hydrogens before using the method ``Molecule.addImplicitHydrogens()```.

options:
* atomLabel: filter to show only a specific atom (default: '')

### getAtomsInfo(options)

Returns an array containing many informations about the atoms.
It may be useful to first create the implicit hydrogens before using the method ``Molecule.addImplicitHydrogens()```.

### toDiastereotopicSVG(options)

Return a SVG containing a circle at the level of each atom having a data-atomid a diastereoisotopic unique identifier.

options:
* height (default: 300)
* width (default: 200)
* prefix : prefix for the id of each SVG element (default: ocl)



### getDiastereotopicHoseCodes(options)

Returns an array containing diastereotopic hoses codes

options:
* maxSphereSize: maxSphere for hose code calculation

### getGroupedHOSECodes(options)

Returns an extended groupedDiastereotopicID with hoses

options:
* atomLabel: filter to show only a specific atom (default: '')
* maxSphereSize: maxSphere for hose code calculation

### toVisualizerMolfile()

### getNumberOfAtoms()

### getExtendedDiastereotopicAtomIDs()

Returns an array of explicit hydrogens added molecule of diastereotopicAtomIDs.
Extra information like the diastereotopicIDs of the molecule are added

### getAllPaths(options)

Returns an array containing all-pairs shortest paths from a connectivity matrix using the FloydWarshall algorithm.
options:
* fromLabel: filter the pairs that start from this specific atom (default: '')
* toLabel: filter the pairs that end at this specific atom (default: '')
* minLength: min path length to report (default: 1)
* maxLength: max path length to report (default: 4)


### getConnectivityMatrix(options)

Returns an array of array (matrix) containing a '1' for all the connected atoms.
An atom is considered connected to itself (dialog is equal to 1). Options allows to
tune the values you want in the matrix.

Options:
* sdt: put the bond order outside the diagonal (default: false)
* mass: put the rounded mass on the diagonal (default: false)
* atomicNo: put the atomic number on the diagonal (default: false)

Example using npm:
```
var OCLE = require('openchemlib-extended');
var molecule = OCLE.Molecule.fromSmiles('c1ccccc1');
var matrix = molecule.getConnectivityMatrix({mass: true, sdt: true});
console.log(matrix);
```



### getMF()

Return an object containing the molecular formula and the molecular formula of each distinct
part of the molecule.
The molecular formula takes into account multihydrates, charges and isotopes.

## License

  [BSD-3-Clause](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/openchemlib-extended.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/openchemlib-extended
[travis-image]: https://img.shields.io/travis/cheminfo-js/openchemlib-extended/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/cheminfo-js/openchemlib-extended
[david-image]: https://img.shields.io/david/cheminfo-js/openchemlib-extended.svg?style=flat-square
[david-url]: https://david-dm.org/cheminfo-js/openchemlib-extended
[download-image]: https://img.shields.io/npm/dm/openchemlib-extended.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/openchemlib-extended
