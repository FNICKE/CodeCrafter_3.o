/**
 * Centralized in-memory cache — shared across all controllers.
 * Using a single module instance (Node.js module caching) ensures
 * all controllers share the same cache state.
 */

const store = new Map();

/**
 * @param {string} key
 * @param {number} ttlMs - time-to-live in milliseconds
 * @returns {any|null}
 */
function get(key, ttlMs) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * @param {string} key
 * @param {any} value
 */
function set(key, value) {
  store.set(key, { value, ts: Date.now() });
}

function del(key) {
  store.delete(key);
}

function clear() {
  store.clear();
}

/**
 * Returns cache stats for debugging.
 */
function stats() {
  return {
    size: store.size,
    keys: Array.from(store.keys()),
  };
}

// Predefined TTLs (milliseconds)
const TTL = {
  QUOTE:           2 * 60 * 1000,   //  2 min — price quotes
  WATCHLIST:       2 * 60 * 1000,   //  2 min — watchlist batch
  CRYPTO:          2 * 60 * 1000,   //  2 min
  COMPANY_BRIEF:   5 * 60 * 1000,   //  5 min — profile + quote w/o news
  COMPANY_NEWS:    5 * 60 * 1000,   //  5 min — company news
  GENERAL_NEWS:    5 * 60 * 1000,   //  5 min — general feed
  SECTOR:         10 * 60 * 1000,   // 10 min — sector ETF quotes change slowly
  TOP_STOCKS:      5 * 60 * 1000,   //  5 min — recommendations
  RECOMMENDATIONS: 5 * 60 * 1000,   //  5 min — budget recommendations
  ASSET_TICKER:    5 * 60 * 1000,   //  5 min — individual asset lookup
};

module.exports = { get, set, del, clear, stats, TTL };
