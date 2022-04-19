import Debug from '../../../../utils/Debug.js';
const debug = Debug('parseOneFile');
async function* parseOneFile(file) {
  try {
    const data = await file.text();
    const object = JSON.parse(data);
    let testedSubstances = object.PC_AssaySubmit.data;
    for await (const entry of testedSubstances) {
      let test_id = object.PC_AssaySubmit.assay.descr?.results;
      let testResults = [];
      for (const test of test_id) {
        let testResult = {};

        for (const outcome of entry.data) {
          if (test.tid === outcome.tid) {
            testResult.name = test.name;
            testResult.description = test.description;
            testResult.result = outcome.value;
          }
        }
        if (testResult.name) {
          testResults.push(testResult);
        }
      }
      let result = {
        _id: entry.sid,
        _data: {
          bioassays: [],
          references: [],
        },
      };
      let description = {};

      if (object.PC_AssaySubmit.assay.descr?.name) {
        description.name = object.PC_AssaySubmit.assay.descr?.name;
      }
      if (
        object.PC_AssaySubmit.assay.descr?.protocol &&
        JSON.stringify(object.PC_AssaySubmit.assay.descr?.protocol) !==
          JSON.stringify([''])
      ) {
        description.protocol = object.PC_AssaySubmit.assay.descr?.protocol;
      }
      if (object.PC_AssaySubmit.assay.descr?.comment) {
        description.comment = object.PC_AssaySubmit.assay.descr?.comment;
      }
      if (testResults.length > 0) {
        description.results = testResults;
      }
      if (entry?.outcome) {
        if (entry?.outcome === 1) {
          description.activityOutcome = ['chemical probe'];
        }
        if (entry?.outcome === 2) {
          description.activityOutcome = ['active'];
        }
        if (entry?.outcome === 3) {
          description.activityOutcome = ['inactive'];
        }
        if (entry?.outcome === 4) {
          description.activityOutcome = ['inconclusive'];
        }
        if (entry?.outcome === 5) {
          description.activityOutcome = ['unspecified'];
        }
      }
      result._data.bioassays.push(description);

      if (object.PC_AssaySubmit.assay.descr?.xref) {
        let reference = {
          pmids: [],
        };
        for (const ref of object.PC_AssaySubmit.assay.descr?.xref) {
          let property = Object.keys(ref.xref)[0];
          if (property === 'pmid') {
            reference.pmids.push(ref.xref[property]);
          } else {
            reference[property] = ref.xref[property];
          }
        }
        result._data.references.push(reference);
      }

      yield result;
    }
  } catch (e) {
    debug(e);
  }
}

export default parseOneFile;
