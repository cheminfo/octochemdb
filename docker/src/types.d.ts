import type { Collection, Db, MongoClient } from 'mongodb';

declare global {
  // ---------------------------------------------------------------------------
  // TitlesAndAbstracts
  // ---------------------------------------------------------------------------

  /**
   * Shape returned by `getTitlesAndAbstracts()` when files are available.
   * Both arrays contain local file-system paths to the downloaded TTL/GZ files.
   */
  interface TitlesAndAbstracts {
    /** Paths to the downloaded abstract dump files. */
    abstractsDownloaded: string[];
    /** Paths to the downloaded title dump files. */
    titlesDownloaded: string[];
  }

  // ---------------------------------------------------------------------------
  // PatentFileInfo
  // ---------------------------------------------------------------------------

  /**
   * Metadata for a single patent dump file discovered on the PubChem FTP index
   * page by `getFileListPatents`.
   */
  interface PatentFileInfo {
    /** Relative href value parsed from the HTML anchor tag. */
    href: string;
    /** File name, e.g. `pc_patent2title_001.ttl.gz`. */
    name: string;
    /** Fully-qualified download URL constructed from the base URL + name. */
    url?: string;
  }

  // ---------------------------------------------------------------------------
  // GetFileListPatentsOptions
  // ---------------------------------------------------------------------------

  /**
   * Options accepted by `getFileListPatents`.
   */
  interface GetFileListPatentsOptions {
    /**
     * Predicate applied to each parsed file entry.
     * Return `true` to keep the entry, `false` / falsy to drop it.
     * Receives `undefined` for lines that could not be parsed.
     */
    fileFilter?: (file: PatentFileInfo | undefined) => boolean;
  }

  // ---------------------------------------------------------------------------
  // PatentEntry
  // ---------------------------------------------------------------------------

  /**
   * Shape of a patent document as it is built during title/abstract ingestion
   * and stored in the `patents` collection.
   */
  interface PatentEntry {
    /** Patent identifier string, e.g. "US12345678". Used as the MongoDB `_id`. */
    _id?: string;
    data?: {
      /** Human-readable patent title. */
      title?: string;
      /** Human-readable patent abstract. */
      abstract?: string;
      /** Number of PubChem compounds that reference this patent. */
      nbCompounds?: number;
    };
  }

  // ---------------------------------------------------------------------------
  // Progress
  // ---------------------------------------------------------------------------

  /**
   * Tracks the synchronisation state of a single collection.
   * One document of this shape is stored per collection in the `admin`
   * MongoDB collection, keyed by `<collectionName>_progress`.
   */
  interface Progress {
    /** Document key: `<collectionName>_progress` */
    _id: string;
    /** Current lifecycle state of the collection sync. */
    state: 'updating' | 'updated' | 'aggregating' | 'aggregated' | string;
    /** Monotonically increasing sequence counter used as `_seq` on inserted documents. */
    seq: number;
    /** Epoch ms when the last sync started. */
    dateStart: number;
    /** Epoch ms when the last sync completed successfully (0 if never). */
    dateEnd: number;
    /**
     * md5 checksum of the serialised source-file list from the last successful
     * sync. Used by `shouldUpdate()` to detect upstream changes.
     */
    sources?: string;
  }

  // ---------------------------------------------------------------------------
  // Logger
  // ---------------------------------------------------------------------------

  /** Structured levelled logger returned by `Debug(context)`. */
  interface Logger {
    fatal(message: string, options?: Record<string, unknown>): Promise<void>;
    error(message: string, options?: Record<string, unknown>): Promise<void>;
    warn(message: string, options?: Record<string, unknown>): Promise<void>;
    info(message: string, options?: Record<string, unknown>): Promise<void>;
    debug(message: string, options?: Record<string, unknown>): Promise<void>;
    trace(message: string, options?: Record<string, unknown>): Promise<void>;
  }

  // ---------------------------------------------------------------------------
  // BioassayEntry
  // ---------------------------------------------------------------------------

  /**
   * Shape of a single bioassay entry built during PubChem bioassay ingestion
   * and stored as a value in the map returned by `getBioassays()`.
   */
  interface BioassayEntry {
    /** Human-readable name of the bioassay. */
    name: string;
    /** Taxonomy data objects for organisms targeted by this assay. */
    targetTaxonomies?: TaxonomyDataList;
  }

  /**
   * Map of PubChem AID → bioassay entry, as returned by `getBioassays()`.
   */
  type BioassayMap = Record<string, BioassayEntry>;

  /**
   * Deduplication set for taxonomy IDs within a single bioassay line.
   * Only the keys (string taxonomy IDs) are meaningful; the array values are
   * empty placeholders used solely to leverage object-key uniqueness.
   */
  type TaxonomyIdSet = Record<string, never[]>;

  /**
   * List of resolved taxonomy data objects attached to a bioassay entry.
   */
  type TaxonomyDataList = Record<string, unknown>[];

  /**
   * Shape of a taxonomy document stored in the `taxonomies` MongoDB collection.
   */
  interface TaxonomyDocument {
    /** NCBI numeric taxon ID, used as the MongoDB `_id`. */
    _id: number;
    /** Taxonomy metadata payload attached to this taxon. */
    data?: Record<string, unknown>;
  }

  /**
   * MongoDB `Collection` used to look up taxonomy documents by numeric taxon ID.
   * Aliased here so call-sites remain free of raw `import('mongodb')` expressions.
   */
  type TaxonomyCollection = Collection<TaxonomyDocument>;

  /**
   * Map of deprecated taxonomy IDs (keys) to their current replacement IDs (values).
   * Used by `getBioassays()` to translate old NCBI taxon IDs before querying.
   */
  type DeprecatedTaxIdMap = Record<string, string>;

  /**
   * Return type of `getBioassays()`. Resolves with a map of AID → bioassay entry,
   * or `undefined` if a fatal error occurred and was persisted to the admin collection.
   */
  type BioassayResult = Promise<BioassayMap | undefined>;

  // ---------------------------------------------------------------------------
  // Bioactivities
  // ---------------------------------------------------------------------------

  /**
   * OCL (OpenChemLib) compound representation fields stored inside a compound
   * document's `data.ocl` sub-object.
   */
  interface OclData {
    /** Canonical IDCode string for the compound structure. */
    idCode?: string;
    /** IDCode of the structure after stripping stereo and tautomer information. */
    noStereoTautomerID?: string;
    /** Atom-coordinate string paired with `idCode`. */
    coordinates?: string;
  }

  /**
   * `OclData` when present, or `undefined` when the OCL cache fetch returned
   * no result without throwing (e.g. non-200 HTTP status).
   */
  type MaybeOclData = OclData | undefined;

  /**
   * Shape of a compound document stored in the `compounds` MongoDB collection.
   */
  interface CompoundDocument {
    /** PubChem CID, used as the MongoDB `_id`. */
    _id: number;
    data?: {
      ocl?: OclData;
    };
  }

  /**
   * MongoDB `Collection` used to look up compound documents by PubChem CID.
   */
  type CompoundCollection = Collection<CompoundDocument>;

  /**
   * Transient tracker holding the OCL fields of the compound that was most
   * recently resolved from the database, used to avoid redundant `findOne`
   * calls when consecutive bioactivity rows share the same CID.
   */
  interface CompoundTracker {
    /** PubChem CID of the currently tracked compound (0 when uninitialised). */
    cid: number;
    /** Internal identifier string (reserved for future use). */
    id?: string;
    idCode?: string;
    noStereoTautomerID?: string;
    coordinates?: string;
  }

  /**
   * Shape of a single bioactivity document yielded by `parseBioactivities()`
   * and inserted into the `bioassays` collection.
   */
  interface BioactivityEntry {
    /** Composite key: `"<cid>_<aid>"`. */
    _id: string;
    /** Monotonically increasing sequence counter stamped by the sync loop. */
    _seq?: number;
    data: {
      /** PubChem Compound ID. */
      cid: number;
      /** PubChem Assay ID. */
      aid: number;
      /** Human-readable assay name. */
      assay: string;
      /** OCL structural data for the compound. */
      ocl: OclData;
      /** Taxonomy data for the organisms targeted by the assay, if available. */
      targetTaxonomies?: TaxonomyDataList;
    };
  }

  // ---------------------------------------------------------------------------
  // Sync
  // ---------------------------------------------------------------------------

  /**
   * Configuration bag passed to `getLastFileSync()` that describes where to
   * fetch a remote dump file and how to store it locally.
   */
  interface SyncOptions {
    /** Full URL of the remote source file (FTP or HTTP). */
    collectionSource: string;
    /** Local directory path where the downloaded file will be stored. */
    destinationLocal: string;
    /** Name of the MongoDB collection being synchronised. */
    collectionName: string;
    /** Base filename (without extension) for the locally cached file. */
    filenameNew: string;
    /** File extension including leading dot, e.g. `'tsv.gz'`. */
    extensionNew: string;
  }

  /**
   * MongoDB `Collection` used to store and query bioactivity documents.
   */
  type BioactivityCollection = Collection<BioactivityEntry>;

  // ---------------------------------------------------------------------------
  // OctoChemConnection
  // ---------------------------------------------------------------------------

  /**
   * Thin wrapper around the MongoDB driver that provides lazy connection
   * management and progress-tracking helpers used throughout the sync
   * and server layers.
   */
  class OctoChemConnection {
    /** Underlying MongoClient. Populated in the constructor. */
    client: MongoClient;
    /** Live `MongoClient` connection; undefined until `init()` resolves. */
    connection: Awaited<ReturnType<MongoClient['connect']>> | undefined;

    constructor();

    /** Closes the active connection, if any. */
    close(): Promise<void>;

    /** Returns the names of all collections in the configured database. */
    getCollectionNames(): Promise<string[]>;

    /**
     * Returns the MongoDB `Collection` for the given name, opening a connection
     * first if one is not already established.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCollection(collectionName: string): Promise<Collection<any>>;

    /** Convenience accessor for the `admin` collection. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAdminCollection(): Promise<Collection<any>>;

    /** Persists an updated `Progress` document to the `admin` collection. */
    setProgress(progress: Progress): Promise<void>;

    /**
     * Retrieves the `Progress` document for the given collection, creating it
     * with default values if it does not yet exist.
     */
    getProgress(collectionName: string): Promise<Progress>;

    /**
     * Returns the configured database, retrying every 5 s until the connection
     * succeeds.
     */
    getDatabase(): Promise<Db>;

    /** Initialises the MongoClient connection (no-op if already connected). */
    init(): Promise<void>;
  }

  // ---------------------------------------------------------------------------
  // Cmaups
  // ---------------------------------------------------------------------------

  /**
   * A single row parsed from the CMAUP Ingredients ("general") TSV file.
   * Fields are all strings because PapaParse returns raw string values.
   *
   * Key fields used during the sync:
   *  - `np_id`       – CMAUP natural-product identifier; becomes the MongoDB `_id`.
   *  - `SMILES`      – structure string passed to OCL to derive `idCode`,
   *                    `noStereoTautomerID`, and `coordinates`.
   *  - `pubchem_cid` – written to `data.cid` when present.
   *  - `pref_name`   – written to `data.commonName` when present.
   *  - `chembl_id`   – written to `data.chemblId` when present.
   */
  interface CmaupsGeneralRow {
    /** CMAUP natural-product identifier, e.g. "NPC12345". */
    np_id: string;
    /** SMILES string for the molecule's structure. */
    SMILES: string;
    /** PubChem Compound ID, if available. */
    pubchem_cid?: string;
    /** Preferred common name of the molecule. */
    pref_name?: string;
    /** ChEMBL compound identifier, if available. */
    chembl_id?: string;
  }

  /**
   * Raw TSV column names as produced by PapaParse from the CMAUP Activity file.
   * All values are strings because PapaParse returns raw string content.
   */
  interface CmaupsActivityTsvRow {
    /** CMAUP ingredient identifier; used as the key in `CmaupsActivityMap`. */
    Ingredient_ID: string;
    /** CMAUP target identifier; looked up in `CmaupsTargetInfoMap`. */
    Target_ID?: string;
    /** Type of biological activity measured (e.g. "IC50"). */
    Activity_Type?: string;
    /** Relational operator for the measured value (e.g. "=", "<", ">"). */
    Activity_Relationship?: string;
    /** Numeric value of the measured activity. */
    Activity_Value?: string;
    /** Unit of the measured activity value (e.g. "nM"). */
    Activity_Unit?: string;
    /** Type of external reference (e.g. "PMID", "DOI"). */
    Reference_ID_Type?: string;
    /** External reference identifier. */
    Reference_ID?: string;
  }

  /**
   * @deprecated Use {@link CmaupsActivityTsvRow} instead.
   * Legacy alias kept for backward compatibility.
   */
  interface CmaupsActivityRow extends CmaupsActivityTsvRow {}

  /**
   * Map from CMAUP ingredient ID (`np_id`) to the array of raw TSV activity rows
   * for that ingredient, built from the Activity file during the cmaups sync.
   * Keyed by the value of `Ingredient_ID` in each row.
   */
  type CmaupsActivityMap = Record<string, CmaupsActivityTsvRow[]>;

  /**
   * A single row parsed from the CMAUP Plants ("species-info") TSV file.
   * Fields are all strings because PapaParse returns raw string values.
   *
   * Key fields used during the sync:
   *  - `Plant_ID`       – map key in `CmaupsSpeciesInfoMap`; looked up using organism IDs
   *                       resolved from `CmaupsSpeciesPairList` in `parseCmaups()`.
   *  - `Species_Tax_ID`,
   *    `Plant_Name`     – written to `taxons.speciesID` / `taxons.species` when present.
   *  - `Genus_Tax_ID`,
   *    `Genus_Name`     – written to `taxons.genusID` / `taxons.genus` when present.
   *  - `Family_Tax_ID`,
   *    `Family_Name`    – written to `taxons.familyID` / `taxons.family` when present.
   */
  interface CmaupsSpeciesInfoRow {
    /** CMAUP internal plant identifier. Used as the map key. */
    Plant_ID: string;
    /** NCBI taxonomy ID for the species. */
    Species_Tax_ID?: string;
    /** Scientific or common species name. */
    Plant_Name?: string;
    /** NCBI taxonomy ID for the genus. */
    Genus_Tax_ID?: string;
    /** Genus name. */
    Genus_Name?: string;
    /** NCBI taxonomy ID for the family. */
    Family_Tax_ID?: string;
    /** Family name. */
    Family_Name?: string;
  }

  /**
   * Map from CMAUP `Plant_ID` to its species-info row.
   * Built from the Plants TSV file during the cmaups sync.
   * Looked up in `parseCmaups()` using the organism IDs resolved from
   * `CmaupsSpeciesPairList` to populate `data.taxonomies` on each entry.
   */
  type CmaupsSpeciesInfoMap = Record<string, CmaupsSpeciesInfoRow>;

  /**
   * A single row parsed from the CMAUP Targets TSV file.
   * Fields are all strings because PapaParse returns raw string values.
   *
   * Key fields used during the sync:
   *  - `Target_ID`              – map key in `CmaupsTargetInfoMap`.
   *  - `Gene_Symbol`            – written to `parsedActivity.geneSymbol` by `getActivities()`.
   *  - `Protein_Name`           – written to `parsedActivity.proteinName`.
   *  - `Uniprot_ID`             – written to `parsedActivity.uniprotId`.
   *  - `ChEMBL_ID`              – written to `parsedActivity.chemblId`.
   *  - `TTD_ID`                 – written to `parsedActivity.ttdId`.
   *  - `Target_Class_Level1`–`3` – written to `parsedActivity.targetClassLevel1`–`3`.
   *  - `if_DTP`,
   *    `if_CYP`,
   *    `if_therapeutic_target` – boolean flags ("0"/"1" strings) written to
   *                              `isDtp`, `isCyp`, `isTherapeuticTarget`.
   */
  interface CmaupsTargetInfoRow {
    /** CMAUP internal target identifier. Used as the map key. */
    Target_ID: string;
    /** HGNC gene symbol. */
    Gene_Symbol?: string;
    /** Full protein name. */
    Protein_Name?: string;
    /** UniProt accession. */
    Uniprot_ID?: string;
    /** ChEMBL compound identifier. */
    ChEMBL_ID?: string;
    /** TTD identifier. */
    TTD_ID?: string;
    /** Primary functional class of the target. */
    Target_Class_Level1?: string;
    /** Secondary functional class of the target. */
    Target_Class_Level2?: string;
    /** Tertiary functional class of the target. */
    Target_Class_Level3?: string;
    /**
     * Flag indicating DTP (Developmental Therapeutics Program) compound ("1" = true, "0" = false).
     * PapaParse returns this as a string because `dynamicTyping` is not enabled.
     */
    if_DTP?: string;
    /** Flag indicating CYP substrate/inhibitor ("1" = true, "0" = false). */
    if_CYP?: string;
    /** Flag indicating therapeutic target status ("1" = true, "0" = false). */
    if_therapeutic_target?: string;
    [key: string]: string | undefined;
  }

  /**
   * Map from CMAUP `Target_ID` to its target-info row.
   * Built from the Targets TSV file during the cmaups sync.
   * Passed to `getActivities()` so that each activity row can be enriched
   * with the target's gene symbol, protein name, and other annotations.
   */
  type CmaupsTargetInfoMap = Record<string, CmaupsTargetInfoRow>;

  /**
   * Map built internally during `parseCmaups()` from species-association pairs.
   * Keys are CMAUP ingredient IDs (np_id); values are arrays of Plant_IDs
   * whose organisms are associated with that ingredient.
   */
  type SpeciesPairedMap = Record<string, string[]>;

  // ---------------------------------------------------------------------------
  // NaCleanupRecord
  // ---------------------------------------------------------------------------

  /**
   * A generic nested-object shape accepted by `recursiveRemoveNa()` as the
   * target for in-place `'NA'` / `'n. a.'` string removal.
   *
   * Key fields used during the sync:
   *  - Each string-valued property – checked against `'NA'` and `'n. a.'`;
   *    the property is deleted in-place when a match is found.
   *  - Each object-valued property – recursed into (with cycle detection) so
   *    that deeply-nested `'NA'` markers are removed alongside top-level ones.
   *    Note: the property being an object does not guarantee its own child
   *    properties are non-null or non-array.
   */
  type NaCleanupRecord = Record<string, unknown>;

  /**
   * Species-association pairs parsed from the CMAUP speciesAssociation TSV file.
   * Each inner array is one row; all values are strings (PapaParse raw output).
   *
   * Column schema (0-based index):
   *  - `[0]` `Plant_ID`      – organism identifier; looked up in `CmaupsSpeciesInfoMap`.
   *  - `[1]` `Ingredient_ID` – molecule identifier (`np_id`); used as the key in `SpeciesPairedMap`.
   *
   * Used in `parseCmaups()` to invert the pairs into `SpeciesPairedMap`, which groups
   * all `Plant_ID` values for each `Ingredient_ID` so that taxonomy rows can be
   * resolved from `CmaupsSpeciesInfoMap` and written to `data.taxonomies`.
   */
  type CmaupsSpeciesPairList = string[][];

  /**
   * Intermediate activity record produced by `getActivities()` before
   * taxonomy enrichment and string-concatenation performed by
   * `getNormalizedActivities()`. Null-valued fields are removed before the
   * record is stored.
   *
   * Key fields used during the sync:
   *  - `activityType`, `activityRelation`,
   *    `activityValue`, `activityUnit`  – concatenated into `assay` by `getNormalizedActivities()`.
   *  - `refIdType`, `refId`             – concatenated into `externalRef`.
   *  - `targetId`                       – used to look up taxonomy data for the target.
   *  - `geneSymbol`, `proteinName`,
   *    `uniprotId`, `chemblId`,
   *    `ttdId`, `targetClassLevel1`–`3` – sourced from `CmaupsTargetInfoRow` by `getActivities()`.
   *  - `isDtp`, `isCyp`,
   *    `isTherapeuticTarget`            – boolean flags derived from the "0"/"1" target-file columns.
   */
  interface CmaupsRawActivity {
    /** Type of the measured biological activity (e.g. "IC50"). */
    activityType?: string;
    /** Relational operator for the value (e.g. "=", "<"). */
    activityRelation?: string;
    /** Numeric activity value as a string. */
    activityValue?: string;
    /** Unit of the activity value (e.g. "nM"). */
    activityUnit?: string;
    /** Type of external literature reference (e.g. "PMID"). */
    refIdType?: string;
    /** External reference identifier. */
    refId?: string;
    /** NCBI taxonomy ID of the biological target. */
    targetId?: string;
    /** Organism in which the assay was performed. */
    assayOrganism?: string;
    /** Functional type classification of the biological target. */
    targetType?: string;
    /** Organism that the target belongs to. */
    targetOrganism?: string;
    /** Name of the biological target. */
    targetName?: string;
    /** HGNC gene symbol of the target. */
    geneSymbol?: string;
    /** Full protein name of the target. */
    proteinName?: string;
    /** UniProt accession for the target protein. */
    uniprotId?: string;
    /** ChEMBL compound identifier. */
    chemblId?: string;
    /** TTD identifier. */
    ttdId?: string;
    /** Primary functional class of the target. */
    targetClassLevel1?: string;
    /** Secondary functional class of the target. */
    targetClassLevel2?: string;
    /** Tertiary functional class of the target. */
    targetClassLevel3?: string;
    /** Whether the compound is a DTP cancer compound. */
    isDtp?: boolean;
    /** Whether the compound is a CYP substrate/inhibitor. */
    isCyp?: boolean;
    /** Whether the target is a therapeutic target. */
    isTherapeuticTarget?: boolean;
  }

  /**
   * Union of the two forms the `activities` field on a `CmaupsEntry` document
   * may take during the sync pipeline:
   *  - `CmaupsRawActivity[]`        before `getNormalizedActivities()` runs
   *  - `CmaupsNormalizedActivity[]` after enrichment in the sync loop
   */
  type CmaupsActivityList = CmaupsRawActivity[] | CmaupsNormalizedActivity[];

  /**
   * A normalized activity object built by `getNormalizedActivities()`.
   * Null-valued fields are deleted before the object is stored, so all
   * optional fields below may be absent in the persisted document.
   *
   * Key fields used during the sync:
   *  - `assay`            – concatenation of `activityType`, `activityRelation`,
   *                         `activityValue`, and `activityUnit` from the raw activity.
   *  - `externalRef`      – concatenation of `refIdType` and `refId`.
   *  - `targetTaxonomies` – resolved via `searchTaxonomies()` using `targetId`;
   *                         set to `result[0].data` when a match is found.
   *  - all other fields   – passed through unchanged from `CmaupsRawActivity`.
   */
  interface CmaupsNormalizedActivity {
    /** Concatenated activity string: "type relation value unit". */
    assay: string;
    /** Concatenated external reference string: "refIdType : refId". */
    externalRef: string;
    /** Organism where the assay was performed, if present. */
    assayOrganism?: string;
    /** Functional type classification of the target, if present. */
    targetType?: string;
    /** Organism containing the target, if present. */
    targetOrganism?: string;
    /** Name of the biological target, if present. */
    targetName?: string;
    /** HGNC gene symbol of the target, if present. */
    geneSymbol?: string;
    /** Full protein name of the target, if present. */
    proteinName?: string;
    /** UniProt accession for the target protein, if present. */
    uniprotId?: string;
    /** ChEMBL identifier, if present. */
    chemblId?: string;
    /** TTD identifier, if present. */
    ttdId?: string;
    /** Primary target functional class, if present. */
    targetClass1?: string;
    /** Secondary target functional class, if present. */
    targetClass2?: string;
    /** Tertiary target functional class, if present. */
    targetClass3?: string;
    /** Resolved taxonomy data for the biological target, when available. */
    targetTaxonomies?: Record<string, unknown>;
  }

  /**
   * Raw taxonomy object built during `parseCmaups()` from the species-info file.
   * Only fields with a truthy value are populated; empty objects are discarded.
   *
   * Key fields used during the sync:
   *  - `speciesID`, `species`   – sourced from `Species_Tax_ID` / `Plant_Name`.
   *  - `genusID`,   `genus`     – sourced from `Genus_Tax_ID`   / `Genus_Name`.
   *  - `familyID`,  `family`    – sourced from `Family_Tax_ID`  / `Family_Name`.
   */
  interface CmaupsTaxonomyEntry {
    /** NCBI species-level taxonomy ID. */
    speciesID?: string;
    /** Scientific species name. */
    species?: string;
    /** NCBI genus-level taxonomy ID. */
    genusID?: string;
    /** Genus name. */
    genus?: string;
    /** NCBI family-level taxonomy ID. */
    familyID?: string;
    /** Family name. */
    family?: string;
  }

  /**
   * The `data` payload of a single CMAUP entry document stored in MongoDB.
   */
  interface CmaupsEntryData {
    /**
     * OCL structural representation of the molecule.
     * Optional because `getNoStereosFromCache` may return `undefined`
     * (non-200 HTTP response without throwing).
     */
    ocl?: OclData;
    /** PubChem Compound ID, when available. */
    cid?: string;
    /** Resolved taxonomic information for source organisms, when available. */
    taxonomies?: CmaupsTaxonomyEntry[] | TaxonomyDataList;
    /** Human-readable preferred name of the compound. */
    commonName?: string;
    /** ChEMBL compound identifier, when available. */
    chemblId?: string;
    /** Normalized biological activity records, when available. */
    activities?: CmaupsActivityList;
  }

  /**
   * Shape of a document stored in the `cmaups` MongoDB collection.
   * Each document represents one natural-product ingredient from the CMAUP database.
   */
  interface CmaupsEntry {
    /** CMAUP natural-product identifier (np_id), used as the MongoDB `_id`. */
    _id: string;
    /** Monotonically increasing sequence counter stamped by the sync loop. */
    _seq?: number;
    /** Payload containing structural and biological data for the molecule. */
    data: CmaupsEntryData;
  }

  /**
   * MongoDB `Collection` used to store and query CMAUP entry documents.
   */
  type CmaupsCollection = Collection<CmaupsEntry>;

  /**
   * Object returned by `readCmaupsFiles()` containing the five parsed data
   * structures derived from the CMAUP source files.
   *
   * Key fields:
   *  - `general`     – parsed rows from the Ingredients file; each row is a `CmaupsGeneralRow`.
   *  - `activities`  – map of `Ingredient_ID` → activity rows (`CmaupsActivityMap`).
   *  - `speciesPair` – species-association pairs as a 2-column string matrix (`CmaupsSpeciesPairList`).
   *  - `speciesInfo` – map of `Plant_ID` → species-info row (`CmaupsSpeciesInfoMap`).
   *  - `targetInfo`  – map of `Target_ID` → target-info row (`CmaupsTargetInfoMap`).
   */
  interface CmaupsFilesData {
    /** Parsed rows from the Ingredients file. */
    general: CmaupsGeneralRow[];
    /** Map of ingredient ID → activity rows. */
    activities: CmaupsActivityMap;
    /** Species-association pairs (columns: Plant_ID, Ingredient_ID). */
    speciesPair: CmaupsSpeciesPairList;
    /** Map of Plant_ID → species-info row. */
    speciesInfo: CmaupsSpeciesInfoMap;
    /** Map of Target_ID → target-info row. */
    targetInfo: CmaupsTargetInfoMap;
  }

  /**
   * Tuple returned by `cmaupsStartSync()`.
   * Destructured positionally in the sync loop; index positions are:
   *   0  lastDocumentImported  – most-recently inserted entry, or null
   *   1  progress              – current sync-progress document
   *   2  sources               – list of source-file paths/names
   *   3  collection            – live MongoDB cmaups collection handle
   *   4  general               – parsed rows from the Ingredients file
   *   5  activities            – map of ingredient ID → activity rows
   *   6  speciesPair           – species-association pairs
   *   7  speciesInfo           – map of Plant_ID → species-info row
   *   8  targetInfo            – map of Target_ID → target-info row
   */
  type CmaupsStartSyncResult = [
    CmaupsEntry | null,
    Progress,
    string[],
    CmaupsCollection,
    CmaupsGeneralRow[],
    CmaupsActivityMap,
    CmaupsSpeciesPairList,
    CmaupsSpeciesInfoMap,
    CmaupsTargetInfoMap,
  ];

  /**
   * Tuple returned by `getCmaupsLastFiles()`.
   * Destructured positionally in `cmaupsStartSync()`; index positions are:
   *   0  lastFileGeneral              – local path to the Ingredients file
   *   1  lastFileActivity             – local path to the Activity file
   *   2  lastFileSpeciesAssociation   – local path to the species-association file
   *   3  lastFileSpeciesInfo          – local path to the Plants file
   *   4  lastTargetInfo               – local path to the Targets file
   *   5  sources                      – relative paths used by `shouldUpdate()`
   *   6  progress                     – current sync-progress document
   */
  type CmaupsLastFilesResult = [
    string,
    string,
    string,
    string,
    string,
    string[],
    Progress,
  ];
}

