# Docker PubChem

[![DOI](https://www.zenodo.org/badge/134719303.svg)](https://www.zenodo.org/badge/latestdoi/134719303)

This project will fetch PubChem data in order to create a local database searchable by experimental monoisotopic mass and molecular formula. When building this database we will correctly take into account the charges and isotopes present in the molfile describing the structure.

## quick start

```
docker-compose up --build -d
```

By default the server will rebuild the full database. This process will take several days !

## API

By default the server is available on port 3001

http://localhost:3001/mfs/em?em=300

### /mfs/em

Search MF from monoisotopic mass

Parameters:

- em: the target monoisotopic mass, mandatory
- precision: mass precision in ppm (default: 100)
- limit: maximal number of results (default: 1000)

Example: `/mfs/em?em=300&precision=10`

### /molecules/em

Search molecules from monoisotopic mass

If must be the exact value of the EM so that is can only be used from the previous query result

Parameters:

- em: the target monoisotopic mass, mandatory

Example: `/molecules/em?em=295.0000687128`

### /molecules/mf

Search molecules from a molecular fomrula

If must be the exact value of the MF so that is can practically only be used from the previous query result

Parameters:

- mf: the target molecular formula, mandatory

Example: `/molecules/mf?mf=C10H20`
