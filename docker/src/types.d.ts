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
}
