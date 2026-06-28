const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');
const HomeSection = require('./models/HomeSection');

const seedHomeSections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Fetch all products keyed by productKey
    const allProducts = await Product.find().lean();
    const byKey = {};
    allProducts.forEach((p) => {
      byKey[p.productKey] = p._id;
    });

    const resolve = (keys) => keys.map((k) => byKey[k]).filter(Boolean);

    // Clear existing home sections
    await HomeSection.deleteMany({});
    console.log('Cleared existing home sections');

    const sections = [
      {
        title: 'Summer Essentials',
        subtitle: 'Beat the heat with cool picks',
        type: 'products',
        sortOrder: 0,
        isActive: true,
        season: 'summer',
        bannerGradient: ['#FF6B35', '#F7931E'],
        products: resolve(['c1', 'c2', 'c3', 'c9', 'c11', 'f2', 'f1', 'f6']),
      },
      {
        title: 'Trending Now',
        subtitle: 'Most popular picks this week',
        type: 'products',
        sortOrder: 1,
        isActive: true,
        season: 'all',
        bannerGradient: ['#1D8A7A', '#0D5D53'],
        products: resolve(['v1', 'f1', 'd1', 'm5', 'c1', 's4', 'b15', 'n8']),
      },
      {
        title: 'Best Sellers',
        subtitle: 'Loved by everyone',
        type: 'products',
        sortOrder: 2,
        isActive: true,
        season: 'all',
        bannerGradient: ['#4A6B38', '#2D4A1E'],
        products: resolve(['d7', 'm6', 'sc10', 'ar1', 'd9', 'v6', 'v7', 'f3']),
      },
      {
        title: 'Cold Drinks & Juices',
        subtitle: 'Chill & refreshing beverages',
        type: 'products',
        sortOrder: 3,
        isActive: true,
        season: 'summer',
        bannerGradient: ['#0077B6', '#023E8A'],
        products: resolve(['c1', 'c2', 'c3', 'c4', 'c9', 'c10', 'c11', 'c13']),
      },
      {
        title: 'Fruits & Fresh',
        subtitle: 'Fresh seasonal fruits',
        type: 'products',
        sortOrder: 4,
        isActive: true,
        season: 'summer',
        bannerGradient: ['#2D6A4F', '#1B4332'],
        products: resolve(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10']),
      },
      {
        title: 'Dairy, Eggs & Bread',
        subtitle: 'Fresh daily essentials',
        type: 'products',
        sortOrder: 5,
        isActive: true,
        season: 'all',
        bannerGradient: ['#C05020', '#8A2E0A'],
        products: resolve(['d1', 'd2', 'd4', 'd7', 'd9', 'd10', 'd5', 'd6']),
      },
      {
        title: 'Munchies & Snacks',
        subtitle: 'Crunchy snacks for any mood',
        type: 'products',
        sortOrder: 6,
        isActive: true,
        season: 'all',
        bannerGradient: ['#F57F17', '#E65100'],
        products: resolve(['m1', 'm5', 'm6', 'm10', 'm7', 'm11', 'm3', 'm4']),
      },
      {
        title: 'Korean Ramen',
        subtitle: 'Trending flavours from Korea',
        type: 'products',
        sortOrder: 7,
        isActive: true,
        season: 'all',
        bannerGradient: ['#B83060', '#7A1C35'],
        products: resolve(['n1', 'n2', 'n3', 'n4', 'n5', 'n8']),
      },
      {
        title: 'Chocolates & Sweets',
        subtitle: 'Indulge your sweet tooth',
        type: 'products',
        sortOrder: 8,
        isActive: true,
        season: 'all',
        bannerGradient: ['#5D4037', '#3E2723'],
        products: resolve(['s4', 's8', 's5', 's9', 's10', 's11', 's12', 's14']),
      },
      {
        title: 'Baby Care',
        subtitle: 'Trusted essentials for your little one',
        type: 'products',
        sortOrder: 9,
        isActive: true,
        season: 'all',
        bannerGradient: ['#0277BD', '#01579B'],
        products: resolve(['bc1', 'bc2', 'bc3', 'bc4', 'bc5', 'bc6', 'bc7', 'bc8']),
      },
      {
        title: 'Sauces & Spreads',
        subtitle: 'Flavour boosters for every meal',
        type: 'products',
        sortOrder: 10,
        isActive: true,
        season: 'all',
        bannerGradient: ['#D84315', '#BF360C'],
        products: resolve(['sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6', 'sc7', 'sc10']),
      },
      {
        title: 'Bakery & Biscuits',
        subtitle: 'Crunchy treats & baked goods',
        type: 'products',
        sortOrder: 11,
        isActive: true,
        season: 'all',
        bannerGradient: ['#6A3AAA', '#4A1A8A'],
        products: resolve(['b15', 'b16', 'b12', 'b3', 'b5', 'b6', 'b10', 'b1']),
      },
      {
        title: 'Kitchen Staples',
        subtitle: 'Atta, rice, dal & more',
        type: 'products',
        sortOrder: 12,
        isActive: true,
        season: 'all',
        bannerGradient: ['#1A8A9A', '#0D5D63'],
        products: resolve(['ar1', 'ar2', 'ar3', 'ar4', 'ar5', 'ar6', 'ar7', 'ar8']),
      },
    ];

    await HomeSection.insertMany(sections);
    console.log(`Seeded ${sections.length} home sections`);

    // Log summary
    sections.forEach((s) => {
      console.log(
        `  ${s.isActive ? 'ON ' : 'OFF'} [${s.sortOrder}] ${s.title} (${s.products.length} products, season: ${s.season})`
      );
    });

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedHomeSections();
