export function getActivities(activity, targetInfo) {
  let finalActivities = [];
  if (activity === undefined) return finalActivities;
  for (const info of activity) {
    const targetActivity = targetInfo[info.Target_ID];
    let parsedActivity = {
      activityType: info?.Activity_Type ? info.Activity_Type : null,
      activityRelation: info?.Activity_Relationship
        ? info.Activity_Relationship
        : null,
      activityValue: info?.Activity_Value ? info.Activity_Value : null,
      activityUnit: info?.Activity_Unit ? info.Activity_Unit : null,
      refIdType: info?.Reference_ID_Type ? info.Reference_ID_Type : null,

      refId: info?.Reference_ID ? info.Reference_ID : null,
      geneSymbol: targetActivity?.Gene_Symbol
        ? targetActivity.Gene_Symbol
        : null,
      proteinName: targetActivity?.Protein_Name
        ? targetActivity.Protein_Name
        : null,
      uniprotId: targetActivity?.Uniprot_ID ? targetActivity.Uniprot_ID : null,
      chemblId: targetActivity?.ChEMBL_ID ? targetActivity.ChEMBL_ID : null,
      ttdId: targetActivity?.TTD_ID ? targetActivity.TTD_ID : null,

      targetClassLevel1: targetActivity?.Target_Class_Level1
        ? targetActivity.Target_Class_Level1
        : null,
      targetClassLevel2: targetActivity?.Target_Class_Level2
        ? targetActivity.Target_Class_Level2
        : null,
      targetClassLevel3: targetActivity?.Target_Class_Level3
        ? targetActivity.Target_Class_Level3
        : null,
      isDtp: false,
      isCyp: false,
      isTherapeuticTarget: false,
    };
    if (targetActivity?.if_DTP === 1) {
      parsedActivity.isDtp = true;
    }
    if (targetActivity?.if_CYP === 1) {
      parsedActivity.isCyp = true;
    }
    if (targetActivity?.if_Therapeutic_Target === 1) {
      parsedActivity.isTherapeuticTarget = true;
    }

    for (const key in parsedActivity) {
      if (parsedActivity[key] === null) {
        delete parsedActivity[key];
      }
    }

    finalActivities.push(parsedActivity);
  }
  return finalActivities;
}
