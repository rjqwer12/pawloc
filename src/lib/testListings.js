// Exact IDs inserted by supabase/test-listings.sql, not names supplied by users.
export const testListingIds = new Set([
  '10000000-0000-4000-8000-000000000001',
  ...[1,2,3,4,5,6].map(number => `20000000-0000-4000-8000-${String(number).padStart(12,'0')}`),
]);
export function isTestListing(row) {
  return (row.owner_id == null && testListingIds.has(row.id)) ||
    (row.kind === 'reservation' && (testListingIds.has(row.parent_id) || testListingIds.has(row.data?.petId) || testListingIds.has(row.data?.shelterId)));
}
