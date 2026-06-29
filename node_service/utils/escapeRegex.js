/**
 * escapeRegex.js
 * Utility to escape user-supplied strings before using them in MongoDB $regex
 * queries. Without this, a malicious search value could cause catastrophic
 * backtracking (ReDoS).
 *
 * Escapes the RegExp metacharacters: . * + ? ^ $ { } ( ) | [ ] \
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
