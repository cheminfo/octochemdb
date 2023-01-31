import OCL from 'openchemlib';

// function can take molfile or smiles as entry but not both
function getNoStereoIDCode(oclMolecule) {
  let noStereoID = OCL.CanonizerUtil.getIDCode(
    oclMolecule,
    OCL.CanonizerUtil.NOSTEREO_TAUTOMER,
  );

  return noStereoID;
}

export default getNoStereoIDCode;
