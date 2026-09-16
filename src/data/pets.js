const buddy = {
  type: 'dog',
  name: 'Buddy',
  age: '1 yr old',
  breed: 'Golden Retriever',
  gender: 'Male',
  distance: '1.4 miles away',
  badge: { label: 'Ready to Adopt', variant: 'blue' },
  description: 'Gentle, playful, and great with kids. Loves fetch and afternoon naps.',
  image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=280&fit=crop',
};

export const pets = Array.from({ length: 8 }, (_, index) => ({
  ...buddy,
  id: index + 1,
}));

export const filters = ['All Pets', 'Dogs', 'Cats', 'Small & Exotic'];
