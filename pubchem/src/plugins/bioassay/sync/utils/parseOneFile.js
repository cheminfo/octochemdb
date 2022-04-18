async function* parseOneFile(files) {
  for await (let file of files) {
    try {
      const data = await file.text();
      const object = JSON.parse(data);
      let testedSubstances = object.PC_AssaySubmit.data;
      for (const entry of testedSubstances) {
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
        let result = {};
        result.sid = entry.sid;
        if (object.PC_AssaySubmit.assay.descr?.name) {
          result.assayDescription = {
            name: object.PC_AssaySubmit.assay.descr?.name,
          };
          if (
            object.PC_AssaySubmit.assay.descr?.protocol &&
            JSON.stringify(object.PC_AssaySubmit.assay.descr?.protocol) !==
              JSON.stringify([''])
          ) {
            result.assayDescription.protocol =
              object.PC_AssaySubmit.assay.descr?.protocol;
          }
          if (object.PC_AssaySubmit.assay.descr?.comment) {
            result.assayDescription.comment =
              object.PC_AssaySubmit.assay.descr?.comment;
          }
        }
        if (testResults.length > 0) {
          result.assayResults = testResults;
        }

        if (entry?.outcome) {
          if (entry?.outcome === 1) {
            result.activityOutcome = 'chemical probe';
          }
          if (entry?.outcome === 2) {
            result.activityOutcome = 'active';
          }
          if (entry?.outcome === 3) {
            result.activityOutcome = 'inactive';
          }
          if (entry?.outcome === 4) {
            result.activityOutcome = 'inconclusive';
          }
          if (entry?.outcome === 5) {
            result.activityOutcome = 'unspecified';
          }
        }
        if (object.PC_AssaySubmit.assay.descr?.xref) {
          result._assayReferences = object.PC_AssaySubmit.assay.descr?.xref;
        }
        yield result;
      }
    } catch (e) {
      continue;
    }
  }
}

export default parseOneFile;
