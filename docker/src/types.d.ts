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
    getCollection(collectionName: string): Promise<Collection>;

    /** Convenience accessor for the `admin` collection. */
    getAdminCollection(): Promise<Collection>;

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
