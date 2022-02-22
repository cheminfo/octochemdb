# Local development

Better if you have docker installed and create the 2 following aliases

- `alias mongod="docker container rm mongod; docker run --name mongod -p 27017:27017 mongo"`
- `alias mongo="docker exec -it mongod mongo"`

You can then easily create a new installe of mongod

# node-pubchem

In this project we make a copy of pubchem and carefully calculate the monoisotopic mass of each of the molecule as well as the molecular formula taking into account charges, parts and isotopes.

We then provide an API that allows to quickly and efficiently search in the database.

## Setup

`npm run server8080`

## Provided webservice

### /mfs/em

Search MF from monoisotopic mass

[/mfs/em?em=300&precision=10](/mfs/em?em=300&precision=10)

Parameters:

- em: the target monoisotopic mass, mandatory
- precision: mass precision in ppm (default: 100)
- limit: maximal number of results (default: 1000)
- fields: list of fields to retrieve

### /molecules/em

Search molecules from monoisotopic mass

If must be the exact value of the EM so that is can only be used from the previous query result

Parameters:

- em: the target monoisotopic mass, mandatory
- limit: maximal number of results (default: 1000)
- fields: list of fields to retrieve

[/molecules/em?em=295.0000687128](molecules/em?em=295.0000687128)

### /molecules/mf

Search molecules from a molecular formula

If must be the exact value of the MF so that is can practically only be used from the previous query result

Parameters:

- mf: the target molecular formula, mandatory
- limit: maximal number of results (default: 1000)
- fields: list of fields to retrieve

[/molecules/mf?mf=C10H20](/molecules/mf?mf=C10H20)

### /molecules/smiles

Search molecules from exact smiles

Parameters:

- smiles: smiles of the target molecule
- stereo: keep stereo information (default: false)
- limit: maximal number of results (default: 1000)
- fields: list of fields to retrieve

[/molecules/smiles?smiles=c1ccccc1](/molecules/smiles?smiles=c1ccccc1)
