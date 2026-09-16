export const storyFilters = ['All', 'Dogs', 'Cats', 'Birds', 'Hamsters'];

const buddyStory = {
  type: 'dog',
  title: 'Buddy & The Thompsons',
  breed: 'Golden Retriever',
  area: 'Valley Metro Area',
  quote:
    'We were terrified when Buddy slipped his collar during thunder. Within 45 minutes of posting to PAWLOC, a neighbor five miles away spotted him and brought him to the…',
  shelter: 'Valley Animal Rescue',
  time: '2 days ago',
  image:
    'https://images.unsplash.com/photo-1601758124510-164b0a0a1d1f?auto=format&fit=crop&w=600&q=80',
};

export const stories = Array.from({ length: 4 }, (_, index) => ({
  ...buddyStory,
  id: index + 1,
}));
