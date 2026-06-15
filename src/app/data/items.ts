export interface Item {
  id: number;
  name: string;
  category: string;
  image: string;
  condition: string;
  size: string;
  distance: string;
  neighborhood: string;
  description: string;
  owner: {
    name: string;
    avatar: string;
    rating: number;
    swapCount: number;
  };
}

// Valencia neighborhoods used as listing locations.
export const NEIGHBORHOODS = [
  "Ruzafa",
  "El Carmen",
  "Benimaclet",
  "Cabanyal",
  "Malvarrosa",
] as const;

export const items: Item[] = [
  {
    id: 1,
    name: "Linen Wide-Leg Pants",
    category: "Pants",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    condition: "Like New",
    size: "M",
    distance: "0.8km",
    neighborhood: "Ruzafa",
    description:
      "Comfortable wide-leg linen pants in natural cream color. Perfect for warm weather and casual occasions. Breathable fabric with a relaxed fit.",
    owner: {
      name: "Sarah Martinez",
      avatar: "https://i.pravatar.cc/150?img=1",
      rating: 4.9,
      swapCount: 23,
    },
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    category: "Jacket",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
    condition: "Good",
    size: "L",
    distance: "1.2km",
    neighborhood: "El Carmen",
    description:
      "Timeless denim jacket in medium wash. Features classic button closure and chest pockets. Versatile piece that pairs well with everything.",
    owner: {
      name: "Michael Chen",
      avatar: "https://i.pravatar.cc/150?img=2",
      rating: 4.8,
      swapCount: 18,
    },
  },
  {
    id: 3,
    name: "Floral Summer Dress",
    category: "Dress",
    image: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800",
    condition: "Like New",
    size: "S",
    distance: "0.5km",
    neighborhood: "Ruzafa",
    description:
      "Lightweight summer dress with delicate floral pattern. Features a flowing silhouette and comfortable fit. Perfect for garden parties or brunch.",
    owner: {
      name: "Emma Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=3",
      rating: 5.0,
      swapCount: 31,
    },
  },
  {
    id: 4,
    name: "Vintage Leather Jacket",
    category: "Jacket",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800",
    condition: "Worn",
    size: "M",
    distance: "2.1km",
    neighborhood: "Cabanyal",
    description:
      "Genuine leather jacket with vintage appeal. Well-loved with natural patina that adds character. Classic moto-style with metal hardware.",
    owner: {
      name: "Jordan Taylor",
      avatar: "https://i.pravatar.cc/150?img=4",
      rating: 4.7,
      swapCount: 15,
    },
  },
  {
    id: 5,
    name: "Elegant Midi Dress",
    category: "Dress",
    image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800",
    condition: "Like New",
    size: "M",
    distance: "1.5km",
    neighborhood: "Benimaclet",
    description:
      "Sophisticated midi dress in rich burgundy. Features a flattering silhouette and elegant draping. Ideal for special occasions or date nights.",
    owner: {
      name: "Olivia Williams",
      avatar: "https://i.pravatar.cc/150?img=5",
      rating: 4.9,
      swapCount: 27,
    },
  },
  {
    id: 6,
    name: "Silk Pattern Scarf",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800",
    condition: "Like New",
    size: "One Size",
    distance: "0.9km",
    neighborhood: "El Carmen",
    description:
      "Luxurious silk scarf with intricate geometric pattern. Versatile accessory that can be worn multiple ways. Adds a touch of elegance to any outfit.",
    owner: {
      name: "Sophia Anderson",
      avatar: "https://i.pravatar.cc/150?img=6",
      rating: 4.8,
      swapCount: 22,
    },
  },
  {
    id: 7,
    name: "Oversized Wool Coat",
    category: "Coat",
    image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800",
    condition: "New",
    size: "L",
    distance: "1.8km",
    neighborhood: "Benimaclet",
    description:
      "Classic wool coat in camel color. Timeless oversized fit perfect for layering. Features deep pockets and elegant silhouette. Ideal for cooler evenings.",
    owner: {
      name: "Lucas Martinez",
      avatar: "https://i.pravatar.cc/150?img=7",
      rating: 4.9,
      swapCount: 19,
    },
  },
  {
    id: 8,
    name: "Chunky Knit Sweater",
    category: "Sweater",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
    condition: "Like New",
    size: "M",
    distance: "0.6km",
    neighborhood: "Ruzafa",
    description:
      "Cozy oversized sweater in soft oatmeal color. Hand-knit texture and relaxed fit. Perfect for crisp autumn days or layering in winter.",
    owner: {
      name: "Isabella Garcia",
      avatar: "https://i.pravatar.cc/150?img=8",
      rating: 5.0,
      swapCount: 34,
    },
  },
  {
    id: 9,
    name: "Leather Ankle Boots",
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800",
    condition: "Good",
    size: "EU 39",
    distance: "1.3km",
    neighborhood: "Cabanyal",
    description:
      "Classic brown leather ankle boots with low heel. Gently worn with beautiful patina. Comfortable for all-day wear and versatile with any outfit.",
    owner: {
      name: "Carmen Lopez",
      avatar: "https://i.pravatar.cc/150?img=9",
      rating: 4.7,
      swapCount: 16,
    },
  },
  {
    id: 10,
    name: "Canvas Tote Bag",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800",
    condition: "New",
    size: "One Size",
    distance: "0.4km",
    neighborhood: "Ruzafa",
    description:
      "Minimalist canvas tote in natural beige. Sturdy construction with leather handles. Perfect for market trips or daily essentials. Eco-friendly and practical.",
    owner: {
      name: "Miguel Santos",
      avatar: "https://i.pravatar.cc/150?img=10",
      rating: 4.8,
      swapCount: 25,
    },
  },
  {
    id: 11,
    name: "Retro Running Sneakers",
    category: "Sneakers",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    condition: "Good",
    size: "EU 42",
    distance: "2.4km",
    neighborhood: "Malvarrosa",
    description:
      "Iconic retro running sneakers in red and white. A little broken in but plenty of life left. Comfortable cushioning for everyday wear.",
    owner: {
      name: "Diego Fernández",
      avatar: "https://i.pravatar.cc/150?img=11",
      rating: 4.6,
      swapCount: 12,
    },
  },
  {
    id: 12,
    name: "Pleated Midi Skirt",
    category: "Skirt",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800",
    condition: "Like New",
    size: "S",
    distance: "0.7km",
    neighborhood: "El Carmen",
    description:
      "Flowing pleated midi skirt in soft sage. Elastic waistband for comfort and an elegant drape. Pairs beautifully with a tucked-in tee.",
    owner: {
      name: "Lucía Romero",
      avatar: "https://i.pravatar.cc/150?img=13",
      rating: 4.9,
      swapCount: 28,
    },
  },
  {
    id: 13,
    name: "Striped Cotton Shirt",
    category: "Shirt",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    condition: "New",
    size: "M",
    distance: "1.1km",
    neighborhood: "Benimaclet",
    description:
      "Crisp breton-striped cotton shirt, never worn. Relaxed fit with a soft collar. A wardrobe staple that goes with everything.",
    owner: {
      name: "Pablo Moreno",
      avatar: "https://i.pravatar.cc/150?img=14",
      rating: 4.8,
      swapCount: 21,
    },
  },
  {
    id: 14,
    name: "Suede Crossbody Bag",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800",
    condition: "Good",
    size: "One Size",
    distance: "3.0km",
    neighborhood: "Malvarrosa",
    description:
      "Warm tan suede crossbody with an adjustable strap. Light signs of use that add character. Just the right size for the essentials.",
    owner: {
      name: "Valeria Ortiz",
      avatar: "https://i.pravatar.cc/150?img=15",
      rating: 4.7,
      swapCount: 14,
    },
  },
  {
    id: 15,
    name: "High-Top Canvas Sneakers",
    category: "Sneakers",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800",
    condition: "Worn",
    size: "EU 40",
    distance: "0.9km",
    neighborhood: "Cabanyal",
    description:
      "Classic white high-top canvas sneakers. Lived-in and lovingly worn — perfect with everything. Laces recently replaced.",
    owner: {
      name: "Hugo Navarro",
      avatar: "https://i.pravatar.cc/150?img=16",
      rating: 4.5,
      swapCount: 9,
    },
  },
  {
    id: 16,
    name: "Quilted Puffer Jacket",
    category: "Jacket",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800",
    condition: "Like New",
    size: "L",
    distance: "1.6km",
    neighborhood: "Benimaclet",
    description:
      "Lightweight quilted puffer in deep olive. Packs down small and keeps you cosy. Barely worn — looking for a new home.",
    owner: {
      name: "Marta Giménez",
      avatar: "https://i.pravatar.cc/150?img=17",
      rating: 4.9,
      swapCount: 26,
    },
  },
  {
    id: 17,
    name: "Wrap Maxi Dress",
    category: "Dress",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
    condition: "New",
    size: "M",
    distance: "0.3km",
    neighborhood: "Ruzafa",
    description:
      "Elegant wrap maxi dress in terracotta. Flattering tie waist and a flowing hem. Brand new with tags — never had the occasion.",
    owner: {
      name: "Carla Vidal",
      avatar: "https://i.pravatar.cc/150?img=18",
      rating: 5.0,
      swapCount: 30,
    },
  },
  {
    id: 18,
    name: "Woven Straw Hat",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?w=800",
    condition: "Good",
    size: "One Size",
    distance: "2.2km",
    neighborhood: "Malvarrosa",
    description:
      "Wide-brim woven straw hat for sunny days by the beach. Holds its shape well with gentle wear. A Cabanyal-summer essential.",
    owner: {
      name: "Nuria Castro",
      avatar: "https://i.pravatar.cc/150?img=19",
      rating: 4.8,
      swapCount: 17,
    },
  },
];

export function getItemById(id: number): Item | undefined {
  return items.find((item) => item.id === id);
}
