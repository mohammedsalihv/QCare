// First load announces unread items once; later polls announce only unseen IDs.
export function unreadArrivals(feed, seen) {
  return feed.filter(item => item._id && !item.isRead && (!seen || !seen.has(item._id)));
}
