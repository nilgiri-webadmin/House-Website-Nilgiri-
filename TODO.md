# Meetups Pagination Implementation

## Tasks:
- [x] Update API (`api/_handlers/meetups/index.ts`) to add offset parameter
- [x] Update Meetups component (`src/components/Meetups.jsx`) to implement pagination with 12 items initially and "Load More" button
- [x] Test the implementation (requires running the application)

## Summary of Changes:
1. **API** - Added `offset` parameter and `hasMore` flag in response for pagination support
2. **Meetups Component** - Modified to:
   - Fetch only 12 meetups initially (instead of 100)
   - Show "Load More" button when there are more meetups to display
   - Load next 12 meetups when button is clicked
