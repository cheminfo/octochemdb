import { searchTaxonomies } from '../../../activesOrNaturals/utils/utilsTaxonomies/searchTaxonomies.js';

import { getCIDfromSID } from './getCIDfromSID.js';

export async function parseBioassaysPubChem(jsonEntry, connection) {
  const assayDescription = jsonEntry.PC_AssaySubmit.assay.descr;
  const dataTable = jsonEntry.PC_AssaySubmit.data;
  let entry = {
    _id: assayDescription.aid.id,
    data: {},
  };

  if (assayDescription.name !== undefined) {
    entry.data.name = assayDescription?.name;
  }
  if (assayDescription?.description !== undefined) {
    entry.data.description = assayDescription?.description.filter(
      (item) => item !== '' && !item.match(/^\s+$/),
    );
  }
  if (assayDescription?.protocol !== undefined) {
    entry.data.protocol = assayDescription?.protocol.filter(
      (item) => item !== '' && !item.match(/^\s+$/),
    );
  }
  if (assayDescription?.comment !== undefined) {
    entry.data.comment = assayDescription?.comment.filter(
      (item) => item !== '' && !item.match(/^\s+$/),
    );
  }
  const valueDescription = {};
  for (let result of assayDescription.results) {
    valueDescription[result.tid] = {
      name: result.name,
      description: result.description,
    };
    const type = result.type;
    if (result.constraint) {
      switch (type) {
        case 2:
          // type int
          valueDescription[result.tid].constraint = {
            iset: result.iset, //Allowed values must be equal to one of these
            imin: result.imin, //Allowed values (x) must be [ imin <= x ]
            imax: result.imax, //Allowed values (x) must be [ x <= imax ]
            irange: result.irange, //Minimum/Maximum Range [ min <= x <= max ]
          };
          break;
        case 4:
          // type string
          valueDescription[result.tid].constraint = {
            sset: result.sset, // Allowed values must be equal to one of these
          };
          break;
        case 3:
          break;
        default:
          // type float
          valueDescription[result.tid].constraint = {
            fset: result.fset, //Allowed values must be equal to one of these
            fmin: result.fmin, //Allowed values (x) must be [ fmin <= x ]
            fmax: result.fmax, //Allowed values (x) must be [ x <= fmax ]
            frange: result.frange, //Minimum/Maximum Range [ min <= x <= max ]
          };
      }
    }

    valueDescription[result.tid].unit = getUnit(result.unit);

    if (result?.tc) {
      valueDescription[result.tid].tc = {
        concentration: result.tc.concentration,
        unit: getUnit(result.tc.unit),
      };
    }
  }

  if (assayDescription.target) {
    const taxonomiesCollection = await connection.getCollection('taxonomies');

    let targets = [];

    for (let target of assayDescription.target) {
      let taxIDs = { _id: target.organism.org.db };

      const taxonomies = await searchTaxonomies(taxonomiesCollection, taxIDs);
      let targetEntry = {
        name: target.name,
      };
      if (taxonomies.length > 0) {
        targetEntry.taxonomies = taxonomies;
      }

      if (target?.descr) {
        targetEntry.description = target.descr; //Target Description  (e.g., cellular functionality and location)
      }
      targets.push(targetEntry);
    }
    if (targets.length > 0) {
      entry.data.targets = targets;
    }
  }
  let { assayResults, sids } = getAssay(dataTable, valueDescription);
  if (sids.length > 0) {
    const cids = await getCIDfromSID(sids);
    if (cids) {
      entry.data.associatedCIDs = cids;
    }
  }
  entry.data.results = assayResults;
  entry.data.sids = sids;

  return entry;
}

function getAssay(dataTable, valueDescription) {
  const assayResults = [];
  const sids = [];
  for (let data of dataTable) {
    const assayResultEntry = {
      sid: data.sid,
      outcome: getOutcome(data.outcome),

      description: [],
    };
    if (data.rank !== undefined) {
      assayResultEntry.rank = data.rank;
    }
    sids.push(data.sid);
    for (let entry of data.data) {
      let description = valueDescription[entry.tid];
      if (entry.value.fval) {
        description.value = entry.value.fval;
      } else if (entry.value.ival) {
        description.value = entry.value.ival;
      } else if (entry.value.sval) {
        description.value = entry.value.sval;
      } else if (entry.value.bval) {
        description.value = entry.value.bval;
      }
      // @ts-ignore
      assayResultEntry.description.push(description);
    }
    assayResults.push(assayResultEntry);
  }
  return { assayResults, sids };
}

function getOutcome(outcome) {
  let result;
  switch (outcome) {
    case 2:
      result = 'active';
      break;
    case 3:
      result = 'inconclusive';
      break;
    case 4:
      result = 'unspecified';
      break;
    case 5:
      result = 'probe';
      break;
    default:
      result = 'inactive';
      break;
  }
  return result;
}

function getUnit(unitType) {
  let result;
  if (unitType === 255 || unitType === undefined) {
    result = 'unspecified';
  } else if (unitType === 254) {
    result = 'none';
  } else {
    // 255 stands for unspecified and 254 for none
    switch (unitType) {
      case 2:
        result = 'ppm';
        break;
      case 3:
        result = 'ppb';
        break;
      case 4:
        result = 'mM';
        break;
      case 5:
        result = 'uM';
        break;
      case 6:
        result = 'nM';
        break;
      case 7:
        result = 'pM';
        break;
      case 8:
        result = 'fM';
        break;
      case 9:
        result = 'mg/ml';
        break;
      case 10:
        result = 'ug/ml';
        break;
      case 11:
        result = 'ng/ml';
        break;
      case 12:
        result = 'pg/ml';
        break;
      case 13:
        result = 'fg/ml';
        break;
      case 14:
        result = 'M';
        break;
      case 15:
        result = '%';
        break;
      case 16:
        result = 'ratio';
        break;
      case 17:
        result = 'sec';
        break;
      case 18:
        result = '1/s';
        break;
      case 19:
        result = 'min';
        break;
      case 20:
        result = '1/min';
        break;
      case 21:
        result = 'day';
        break;
      case 22:
        result = '1/day';
        break;
      case 23:
        result = 'mL/min/kg';
        break;
      case 24:
        result = 'L/kg';
        break;
      case 25:
        result = 'h/ng/mL';
        break;
      case 26:
        result = 'cm/s';
        break;
      case 27:
        result = 'mg/kg';
        break;
      default:
        result = 'ppt';
    }
  }
  return result;
}
