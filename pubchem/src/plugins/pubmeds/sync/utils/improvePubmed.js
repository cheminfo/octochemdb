import workerpool from 'workerpool';

async function improvePubmed(entry) {
  let medlineCitation = entry.MedlineCitation;

  // get generic information
  let pmid = medlineCitation.PMID['#text'];
  let dateCreated = medlineCitation.DateCreated;
  let dateCompleted = medlineCitation.DateCompleted;
  let dateRevised = medlineCitation.DateRevised;
  let medlineJournalInfo = medlineCitation.MedlineJournalInfo;
  /// parse article
  let medlineArticle = medlineCitation.Article;
  let parsedArticle = {};

  if (medlineArticle.ArticleTitle) {
    parsedArticle.title = medlineArticle.ArticleTitle.replace('[', '').replace(
      ']',
      '',
    );
  }
  if (medlineArticle.Abstract) {
    parsedArticle.abstract = medlineArticle.Abstract;
  }
  if (medlineArticle.Journal) {
    let cleanedJournal = {};
    if (medlineArticle.Journal.Title) {
      cleanedJournal.title = medlineArticle.Journal.Title;
    }
    if (medlineArticle.Journal.ISOAbbreviation) {
      cleanedJournal.isoAbbreviation = medlineArticle.Journal.ISOAbbreviation;
    }
    if (medlineArticle.Journal.ISSN) {
      cleanedJournal.iSSN = medlineArticle.Journal.ISSN['#text'];
    }
    if (medlineArticle.Journal.JournalIssue.volume) {
      cleanedJournal.volume = medlineArticle.Journal.JournalIssue.Volume;
    }
    if (medlineArticle.Journal.JournalIssue.Issue) {
      cleanedJournal.issue = medlineArticle.Journal.JournalIssue.Issue;
    }
    if (medlineArticle.Journal.JournalIssue.PubDate) {
      cleanedJournal.pubDate = medlineArticle.Journal.JournalIssue.PubDate;
    }
    parsedArticle.journal = cleanedJournal;
  }
  if (medlineArticle.AuthorList) {
    if (Array.isArray(medlineArticle.AuthorList.Author) === false) {
      medlineArticle.AuthorList.Author = [medlineArticle.AuthorList.Author];
    }
    let cleanedAuthors = medlineArticle.AuthorList.Author.map((author) => {
      let cleanedAuthor = {};
      if (author.ForeName) {
        cleanedAuthor.firstName = author.ForeName;
      }
      if (author.LastName) {
        cleanedAuthor.lastName = author.LastName;
      }
      if (author.Initials) {
        cleanedAuthor.initials = author.Initials;
      }
      return cleanedAuthor;
    });
    parsedArticle.authors = cleanedAuthors;
  }
  if (medlineArticle.Language) {
    parsedArticle.language = medlineArticle.Language;
  }
  if (medlineArticle.PublicationTypeList) {
    if (
      Array.isArray(medlineArticle.PublicationTypeList.PublicationType) ===
      false
    ) {
      medlineArticle.PublicationTypeList.PublicationType = [
        medlineArticle.PublicationTypeList.PublicationType,
      ];
    }
    parsedArticle.publicationTypeList =
      medlineArticle.PublicationTypeList.PublicationType.map(
        (publicationType) => {
          return publicationType['#text'];
        },
      );
  }
  if (medlineArticle.ELocationID) {
    let key = medlineArticle.ELocationID.$EIdType;
    parsedArticle[key] = medlineArticle.ELocationID['#text'];
  }
  if (
    medlineArticle.DataBankList?.DataBank.DataBankName === 'PubChem-Substance'
  ) {
    parsedArticle.sids =
      medlineArticle.DataBankList.DataBank.AccessionNumberList.AccessionNumber;
  }
  let chemicals;
  if (medlineCitation.ChemicalList) {
    if (Array.isArray(medlineCitation.ChemicalList.Chemical) === false) {
      medlineCitation.ChemicalList.Chemical = [
        medlineCitation.ChemicalList.Chemical,
      ];
    }
    let cleanedChemicals = medlineCitation.ChemicalList.Chemical.map(
      (chemical) => {
        let cleanedChemical = {};
        if (chemical.NameOfSubstance) {
          cleanedChemical.nameOfSubstance = chemical.NameOfSubstance['#text'];
        }
        if (
          chemical.RegistryNumber !== undefined &&
          chemical.RegistryNumber !== 0
        ) {
          if (chemical.RegistryNumber.includes('-')) {
            cleanedChemical.casNumber = chemical.RegistryNumber;
          }
          if (chemical.RegistryNumber.includes('EC ')) {
            cleanedChemical.ecNumber = chemical.RegistryNumber; // for enzymes
          }
          if (
            !chemical.RegistryNumber.includes('-') &&
            !chemical.RegistryNumber.includes('EC ')
          ) {
            cleanedChemical.unii = chemical.RegistryNumber; //Unique Ingredient Identifiers (UNIIs) from FDA
          }
        }
        return cleanedChemical;
      },
    );
    chemicals = cleanedChemicals;
  }

  let supplMesh;
  if (medlineCitation.SupplMeshList) {
    if (Array.isArray(medlineCitation.SupplMeshList.SupplMeshName) === false) {
      medlineCitation.SupplMeshList.SupplMeshName = [
        medlineCitation.SupplMeshList.SupplMeshName,
      ];
    }
    let cleanedSupplMesh = medlineCitation.SupplMeshList.SupplMeshName.map(
      (supplMeshName) => {
        let cleanedSupplMesh = {};
        if (supplMeshName) {
          cleanedSupplMesh[supplMeshName.$Type] = supplMeshName['#text'];
        }
        return cleanedSupplMesh;
      },
    );
    supplMesh = cleanedSupplMesh;
  }
  let meshHeadings;
  if (medlineCitation.MeshHeadingList) {
    if (Array.isArray(medlineCitation.MeshHeadingList.MeshHeading) === false) {
      medlineCitation.MeshHeadingList.MeshHeading = [
        medlineCitation.MeshHeadingList.MeshHeading,
      ];
    }
    let cleanedMeshHeadings = medlineCitation.MeshHeadingList.MeshHeading.map(
      (meshHeading) => {
        let cleanedMeshHeading = {};
        if (meshHeading.DescriptorName) {
          cleanedMeshHeading.descriptorName =
            meshHeading.DescriptorName['#text'];
        }
        if (
          meshHeading.QualifierName &&
          meshHeading.QualifierName['#text'] !== null
        ) {
          cleanedMeshHeading.qualifierName = meshHeading.QualifierName['#text'];
        }
        return cleanedMeshHeading;
      },
    );
    meshHeadings = cleanedMeshHeadings;
  }
  let result = {
    _id: pmid,
    _seq: 0,
    data: {},
  };
  if (dateCreated) {
    result.data.dateCreated = dateCreated;
  }
  if (dateCompleted) {
    result.data.dateCompleted = dateCompleted;
  }
  if (dateRevised) {
    result.data.dateRevised = dateRevised;
  }
  if (parsedArticle) {
    result.data.article = parsedArticle;
  }
  if (chemicals) {
    result.data.chemicals = chemicals;
  }
  if (supplMesh) {
    result.data.supplMesh = supplMesh;
  }
  if (meshHeadings) {
    result.data.meshHeadings = meshHeadings;
  }
  if (medlineJournalInfo) {
    result.data.journalInfo = medlineJournalInfo;
  }

  return result;
}

workerpool.worker({
  improvePubmed,
});
