// Schema changes alone do not remove an existing MongoDB unique index.
// Only migrate the single-field email index; preserve all identity indexes.
const ensureSharedUserEmails = async (collection) => {
  let indexes;
  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error.code === 26) return; // Collection does not exist yet.
    throw error;
  }
  for (const index of indexes) {
    if (index.unique && index.key.email === 1 && Object.keys(index.key).length === 1) {
      await collection.dropIndex(index.name);
    }
  }
  await collection.createIndex({ email: 1 });
};

module.exports = { ensureSharedUserEmails };
