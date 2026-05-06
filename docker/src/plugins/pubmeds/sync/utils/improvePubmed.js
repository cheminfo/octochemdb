import debugLibrary from '../../../../utils/Debug.js';

import { toCamelCase } from './toCamelCase.js';

/**
 * Transforms a raw `PubmedArticle` XML element into a normalised document
 * ready for insertion into the `pubmeds` MongoDB collection.
 *
 * Extracts and camelCase-normalises: dates, article metadata (title,
 * abstract, journal, authors, language, publication types, ELocationIDs,
 * PubChem-Substance SIDs), chemical substances (CAS / EC / UNII numbers),
 * supplementary MeSH terms, and MeSH headings.
 *
 * Compound cross-references (`data.compounds`) are populated from the
 * pre-built PMID→CID lookup map so that each article links to the
 * PubChem compounds it describes.
 *
 * @param {object} entry - Raw `PubmedArticle` element from the XML parser.
 * @param {Record<string, number[]>} pmidToCid - PMID → CID[] lookup map.
 * @param {Record<string, string>} langPubmeds - ISO-639 code → full name map.
 * @returns {Promise<{ _id: number; _seq: number; data: Record<string, unknown> }>}
 *   Normalised PubMed document.
 */
export async function improvePubmed(entry, pmidToCid, langPubmeds) {
  const debug = debugLibrary('improvePubmed');

  const medlineCitation = entry.MedlineCitation;
  const pmid = medlineCitation.PMID['#text'];
  const cids = pmidToCid[pmid];

  /** @type {{ _id: number; _seq: number; data: Record<string, unknown> }} */
  const result = {
    _id: pmid,
    _seq: 0,
    data: {},
  };

  // Build compound cross-references from the PMID→CID map
  if (cids) {
    const dbRefs = [];
    for (const cid of cids) {
      dbRefs.push({ $ref: 'compounds', $id: cid });
    }
    result.data.compounds = dbRefs;
  }

  try {
    // Convert date and journal-info objects to camelCase keys
    const dateCreated = toCamelCase(medlineCitation.DateCreated);
    const dateCompleted = toCamelCase(medlineCitation.DateCompleted);
    const dateRevised = toCamelCase(medlineCitation.DateRevised);
    const medlineJournalInfo = toCamelCase(medlineCitation.MedlineJournalInfo);

    // --- Article metadata ---------------------------------------------------
    const medlineArticle = medlineCitation.Article;
    const parsedArticle = {};

    // Title: may be a plain string, an object with '#text', or bracketed
    if (medlineArticle.ArticleTitle !== undefined) {
      if (medlineArticle.ArticleTitle['#text']) {
        parsedArticle.title = medlineArticle.ArticleTitle['#text'];
      } else if (
        medlineArticle?.ArticleTitle?.includes('[') &&
        medlineArticle?.ArticleTitle?.includes(']')
      ) {
        parsedArticle.title = medlineArticle.ArticleTitle.replace(
          '[',
          '',
        ).replace(']', '');
      } else {
        parsedArticle.title = medlineArticle.ArticleTitle;
      }
    }

    // Abstract: may be an array of structured sections, a string, or an object
    if (medlineArticle.Abstract !== undefined) {
      if (Array.isArray(medlineArticle.Abstract.AbstractText)) {
        const abstracts = [];
        for (let i = 0; i < medlineArticle.Abstract.AbstractText.length; i++) {
          const abstractText = medlineArticle.Abstract.AbstractText[i]['#text'];
          if (abstractText && abstractText !== null) {
            abstracts.push(abstractText);
          }
        }
        parsedArticle.abstract = abstracts.join(' ');
      } else if (typeof medlineArticle.Abstract.AbstractText === 'string') {
        parsedArticle.abstract = medlineArticle.Abstract.AbstractText;
      } else {
        parsedArticle.abstract = medlineArticle.Abstract.AbstractText['#text'];
      }
    }

    // Journal information (title, ISO abbreviation, ISSN, volume, issue, date)
    if (medlineArticle.Journal !== undefined) {
      const cleanedJournal = {};
      if (medlineArticle.Journal.Title !== undefined) {
        cleanedJournal.title = medlineArticle.Journal.Title;
      }
      if (medlineArticle.Journal.ISOAbbreviation !== undefined) {
        cleanedJournal.isoAbbreviation = medlineArticle.Journal.ISOAbbreviation;
      }
      if (medlineArticle.Journal.ISSN !== undefined) {
        cleanedJournal.issn = medlineArticle.Journal.ISSN['#text'];
      }
      if (medlineArticle.Journal.JournalIssue.volume !== undefined) {
        cleanedJournal.volume = medlineArticle.Journal.JournalIssue.Volume;
      }
      if (medlineArticle.Journal.JournalIssue.Issue !== undefined) {
        cleanedJournal.issue = medlineArticle.Journal.JournalIssue.Issue;
      }
      if (medlineArticle.Journal.JournalIssue.PubDate !== undefined) {
        cleanedJournal.pubDate = medlineArticle.Journal.JournalIssue.PubDate;
      }
      parsedArticle.journal = cleanedJournal;
    }

    // Authors list (normalise singleton to array)
    if (medlineArticle.AuthorList !== undefined) {
      if (Array.isArray(medlineArticle.AuthorList.Author) === false) {
        medlineArticle.AuthorList.Author = [medlineArticle.AuthorList.Author];
      }
      const cleanedAuthors = medlineArticle.AuthorList.Author.map((author) => {
        const cleanedAuthor = {};
        if (author.ForeName !== undefined) {
          cleanedAuthor.firstName = author.ForeName;
        }
        if (author.LastName !== undefined) {
          cleanedAuthor.lastName = author.LastName;
        }
        if (author.Initials !== undefined) {
          cleanedAuthor.initials = author.Initials;
        }
        return cleanedAuthor;
      });
      parsedArticle.authors = cleanedAuthors;
    }

    // Language (expand ISO code to full name for text-search indexing)
    if (medlineArticle.Language !== undefined) {
      if (langPubmeds[medlineArticle.Language] !== undefined) {
        parsedArticle.languageTextSearch = langPubmeds[medlineArticle.Language];
      }
      parsedArticle.language = medlineArticle.Language;
    }

    // Publication types (normalise singleton to array)
    if (medlineArticle.PublicationTypeList !== undefined) {
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

    // Electronic location identifier (DOI, PII, etc.)
    if (medlineArticle.ELocationID !== undefined) {
      const key = medlineArticle.ELocationID.$EIdType;
      parsedArticle[key] = medlineArticle.ELocationID['#text'];
    }

    // PubChem-Substance accession numbers, if present
    if (
      medlineArticle.DataBankList?.DataBank.DataBankName === 'PubChem-Substance'
    ) {
      parsedArticle.sids =
        medlineArticle.DataBankList.DataBank.AccessionNumberList.AccessionNumber;
    }

    // --- Chemical substances ------------------------------------------------
    let chemicals;
    if (medlineCitation.ChemicalList !== undefined) {
      if (Array.isArray(medlineCitation.ChemicalList.Chemical) === false) {
        medlineCitation.ChemicalList.Chemical = [
          medlineCitation.ChemicalList.Chemical,
        ];
      }
      const cleanedChemicals = medlineCitation.ChemicalList.Chemical.map(
        (chemical) => {
          const cleanedChemical = {};
          if (chemical.NameOfSubstance !== undefined) {
            cleanedChemical.nameOfSubstance = chemical.NameOfSubstance['#text'];
          }
          // Classify the registry number as CAS, EC, or UNII
          if (
            chemical.RegistryNumber !== undefined &&
            chemical.RegistryNumber !== 0
          ) {
            if (Array.isArray(chemical.RegistryNumber) === false) {
              chemical.RegistryNumber = [chemical.RegistryNumber];
            }
            if (
              chemical.RegistryNumber.includes('-') &&
              !chemical.RegistryNumber.includes('EC ')
            ) {
              cleanedChemical.casNumber = chemical.RegistryNumber[0];
            }
            if (chemical.RegistryNumber.includes('EC ')) {
              cleanedChemical.ecNumber = chemical.RegistryNumber[0];
            }
            if (
              !chemical.RegistryNumber.includes('-') &&
              !chemical.RegistryNumber.includes('EC ')
            ) {
              // Unique Ingredient Identifiers (UNIIs) from FDA
              cleanedChemical.unii = chemical.RegistryNumber[0];
            }
          }
          return cleanedChemical;
        },
      );
      chemicals = cleanedChemicals;
    }

    // --- Supplementary MeSH terms -------------------------------------------
    let supplMesh;
    if (medlineCitation.SupplMeshList !== undefined) {
      if (
        Array.isArray(medlineCitation.SupplMeshList.SupplMeshName) === false
      ) {
        medlineCitation.SupplMeshList.SupplMeshName = [
          medlineCitation.SupplMeshList.SupplMeshName,
        ];
      }
      const cleanedSupplMesh = medlineCitation.SupplMeshList.SupplMeshName.map(
        (supplMeshName) => {
          const entry = {};
          if (supplMeshName) {
            entry[supplMeshName.$Type] = supplMeshName['#text'];
          }
          return entry;
        },
      );
      supplMesh = cleanedSupplMesh;
    }

    // --- MeSH headings ------------------------------------------------------
    let meshHeadings;
    if (medlineCitation.MeshHeadingList !== undefined) {
      if (
        Array.isArray(medlineCitation.MeshHeadingList.MeshHeading) === false
      ) {
        medlineCitation.MeshHeadingList.MeshHeading = [
          medlineCitation.MeshHeadingList.MeshHeading,
        ];
      }
      const cleanedMeshHeadings =
        medlineCitation.MeshHeadingList.MeshHeading.map((meshHeading) => {
          const cleanedMeshHeading = {};
          if (meshHeading.DescriptorName) {
            cleanedMeshHeading.descriptorName =
              meshHeading.DescriptorName['#text'];
          }
          if (meshHeading.QualifierName) {
            if (meshHeading.QualifierName['#text']) {
              cleanedMeshHeading.qualifierName =
                meshHeading.QualifierName['#text'];
            }
          }
          return cleanedMeshHeading;
        });
      meshHeadings = cleanedMeshHeadings;
    }

    // --- Assemble the final result ------------------------------------------
    if (dateCreated !== undefined) {
      result.data.dateCreated = dateCreated;
    }
    if (dateCompleted !== undefined) {
      result.data.dateCompleted = dateCompleted;
    }
    if (dateRevised !== undefined) {
      result.data.dateRevised = dateRevised;
    }
    if (parsedArticle !== undefined) {
      result.data.article = parsedArticle;
    }
    if (chemicals !== undefined) {
      result.data.chemicals = chemicals;
    }
    if (supplMesh !== undefined) {
      result.data.supplMesh = supplMesh;
    }
    if (meshHeadings !== undefined) {
      result.data.meshHeadings = meshHeadings;
    }
    if (medlineJournalInfo !== undefined) {
      result.data.journalInfo = medlineJournalInfo;
    }
  } catch (e) {
    debug.warn(e);
  }

  return result;
}
