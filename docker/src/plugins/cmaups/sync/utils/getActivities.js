/**
 * Builds the array of raw activity records for a single CMAUP ingredient by
 * joining each activity row against the Targets map. Falsy optional fields
 * are set to `undefined` so they are omitted from the resulting objects.
 *
 * @param {CmaupsActivityTsvRow[] | undefined} activity - Raw TSV activity rows for this ingredient,
 *   keyed from `CmaupsActivityMap`. When `undefined` (ingredient has no recorded activities)
 *   an empty array is returned immediately. Column names match the TSV file verbatim:
 *   `Activity_Type`, `Activity_Relationship`, `Activity_Value`,
 *   `Activity_Unit`, `Reference_ID_Type`, `Reference_ID`, `Target_ID`.
 * @param {CmaupsTargetInfoMap} targetInfo - Map of `Target_ID` → target-info row, used to
 *   enrich each activity with `Gene_Symbol`, `Protein_Name`, `Uniprot_ID`, `ChEMBL_ID`,
 *   `TTD_ID`, `Target_Class_Level1`–`3`, and the numeric flag columns
 *   `if_DTP`, `if_CYP`, `if_Therapeutic_Target`.
 * @returns {CmaupsRawActivity[]}
 */
export function getActivities(activity, targetInfo) {
  /** @type {CmaupsRawActivity[]} */
  const finalActivities = [];
  if (activity === undefined) return finalActivities;
  for (const row of activity) {
    const targetActivity = targetInfo[row.Target_ID ?? ''];
    /** @type {CmaupsRawActivity} */
    const parsedActivity = {
      activityType: row.Activity_Type ? row.Activity_Type : undefined,
      activityRelation: row.Activity_Relationship
        ? row.Activity_Relationship
        : undefined,
      activityValue: row.Activity_Value ? row.Activity_Value : undefined,
      activityUnit: row.Activity_Unit ? row.Activity_Unit : undefined,
      refIdType: row.Reference_ID_Type ? row.Reference_ID_Type : undefined,
      refId: row.Reference_ID ? row.Reference_ID : undefined,
      targetId: row.Target_ID ? row.Target_ID : undefined,
      geneSymbol: targetActivity?.Gene_Symbol
        ? targetActivity.Gene_Symbol
        : undefined,
      proteinName: targetActivity?.Protein_Name
        ? targetActivity.Protein_Name
        : undefined,
      uniprotId: targetActivity?.Uniprot_ID ? targetActivity.Uniprot_ID : undefined,
      chemblId: targetActivity?.ChEMBL_ID ? targetActivity.ChEMBL_ID : undefined,
      ttdId: targetActivity?.TTD_ID ? targetActivity.TTD_ID : undefined,

      targetClassLevel1: targetActivity?.Target_Class_Level1
        ? targetActivity.Target_Class_Level1
        : undefined,
      targetClassLevel2: targetActivity?.Target_Class_Level2
        ? targetActivity.Target_Class_Level2
        : undefined,
      targetClassLevel3: targetActivity?.Target_Class_Level3
        ? targetActivity.Target_Class_Level3
        : undefined,
      isDtp: false,
      isCyp: false,
      isTherapeuticTarget: false,
    };
    if (targetActivity?.if_DTP === '1') {
      parsedActivity.isDtp = true;
    }
    if (targetActivity?.if_CYP === '1') {
      parsedActivity.isCyp = true;
    }
    if (targetActivity?.if_therapeutic_target === '1') {
      parsedActivity.isTherapeuticTarget = true;
    }

    finalActivities.push(parsedActivity);
  }
  return finalActivities;
}
