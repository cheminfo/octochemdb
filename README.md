# Docker PubChem

[![DOI](https://www.zenodo.org/badge/134719303.svg)](https://www.zenodo.org/badge/latestdoi/134719303)

This project will fetch [multiple](##Sources) databases data in order to create a local database searchable by experimental monoisotopic mass and molecular formula. When building this database we will correctly take into account the charges and isotopes present in the molfile describing the structure.

## Quick start

```
docker-compose up --build -d
```

By default the server will rebuild the full database. This process will take several days !

### <ins>Attention:</ins>

This project depends on [ocl-cache-docker](https://github.com/cheminfo/ocl-cache-docker), please be sure to build it before start using Docker PubChem.

## API

By default the server is available on port 3001

http://localhost:3001/mfs/em?em=300

### <ins>/mfs/v1/fromEM</ins>

Search MF from monoisotopic mass

Parameters:

- em: the target monoisotopic mass, mandatory
- precision: mass precision in ppm (default: 100)
- limit: maximal number of results (default: 1000)
- fields: fields to retrieve (default: em, \_id, count, atom, unsaturation)

Example: [mfs fromEM](`http://localhost:3001/mfs/v1/fromEM?em=300&precision=100&limit=10&fields=_id`)

### <ins>/gnps/v1/fromID</ins>

Search mass spectra from GNPS ID

Parameters:

- id: gnps ID (default: CCMSLIB00000001547)
- fields: fields to retrieve (default: data.ocl.noStereoTautomerID)

Example: [GNPS fromID](`http://localhost:3001/gnps/v1/fromID?id=CCMSLIB00000001547&fields=data.ocl.noStereoTautomerID`)

### <ins>/pubmeds/v1/fromPMID</ins>

Search publication from a PubMed ID

Parameters:

- pmid: PubMed ID of the publication (default: 1)
- fields: fields to be retrieved (default: data.article.title, data.cids)

Example: [PubMed fromPMID](`http://localhost:3001/pubmeds/v1/fromPMID?pmid=1&fields=data.article.title%2Cdata.cids`)

### <ins>/taxonomies/v1/taxonomyFromID</ins>

Search standerized taxonomy from a NCBI Taxonomy ID.

Parameters:

- id: NCBI ID of the organism (default: 562)

Example: [NCBI taxonomyFromID](`http://localhost:3001/taxonomies/v1/taxonomyFromID?id=562`)

### <ins>/activesOrNaturals/v1/fromEM</ins>

Search molecules known to be bioactives or naturals from monoisotopic mass.

Parameters:

- em: monoisotopic mass (default: 300)
- precision: mass precision in ppm (default: 100)
- kwTaxonomies: taxonomies family, genus or species (optional)
- kwBioassays: keywords used on the bioassays (optional)
- kwActiveAgainst: taxonomy superkingdom, kingdom or phylum of target organism in bioassays (optional)
- kwMeshTerms: MeSH terms used by PubMed to indexing articles (optional)
- limit: maximal number of results (default: 1000)
- fields: fields to retrieve (default: data.em, data.mf)

Example: [ActivesOrNaturals fromEM](`http://localhost:3001/activesOrNaturals/v1/fromEM?em=334.17&precision=1000&kwActiveAgainst=viruses&limit=10&fields=data.em%2C%20data.mf`)

### <ins>/activesOrNaturals/v1/fromID</ins>

Search all availeble data for a OCL noStereoTautomerID.

Parameters:

- id: noStereoTautomerID of the structure

Example: [ActivesOrNaturals fromID](`http://localhost:3001/activesOrNaturals/v1/fromID?id=fasAP@@JlDnRJJJIRZIUHqPcINjjjjjjZj%60@uTcFLLpKEl%5EqGF%5CEpOGzPpMGGpq%7CL`)

## Sources

<!-- TABLE_GENERATE_START -->

| Database | Source                                                          |
| -------- | --------------------------------------------------------------- |
| PubChem  | [Link](https://pubchem.ncbi.nlm.nih.gov/)                       |
| PubMed   | [Link](https://pubmed.ncbi.nlm.nih.gov/)                        |
| Lotus    | [Link](https://lotus.naturalproducts.net/)                      |
| Coconut  | [Link](https://coconut.naturalproducts.net/)                    |
| CMAUP    | [Link](https://bidd.group/CMAUP/)                               |
| GNPS     | [Link](https://gnps.ucsd.edu/ProteoSAFe/static/gnps-splash.jsp) |
| NPASS    | [Link](https://bidd.group/NPASS/)                               |
| NP Atlas | [Link](https://www.npatlas.org/)                                |

<!-- TABLE_GENERATE_END -->
