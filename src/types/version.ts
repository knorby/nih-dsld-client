/**
 * Response from `GET /version` — metadata about the deployed DSLD API.
 */
export interface VersionInfo {
  /** API title (e.g. `"DSLD API"`). */
  title?: string;
  /** Deployment config (e.g. `"production"`). */
  config?: string;
  /** Semantic-ish API version (e.g. `"9.5.0"`). */
  version?: string;
  /** Human-readable version timestamp (e.g. `"May 2026"`). */
  versionTimeStamp?: string;
  /** Elasticsearch indices backing this API version. */
  esIndexProcessed?: string;
}
