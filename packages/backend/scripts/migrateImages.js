/**
 * Migration script: populate product images[] from bundled asset filenames.
 * Maps productKey → image filename (same file already copied to uploads/products/).
 * Run once: node scripts/migrateImages.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Product = require('../models/Product');

const KEY_TO_FILE = {
  v1: 'tomato.jpg',
  v2: 'brinjles.jpg',
  v3: 'cabagge.jpg',
  v4: 'cauliflower.jpg',
  v5: 'brocolli.jpg',
  v6: 'onions.jpg',
  v7: 'potato.jpg',
  v8: 'garlic.jpg',
  v9: 'lemon.jpg',
  v10: 'beetroot.jpg',
  v11: 'carrots.jpg',
  v12: 'pumpkins.jpg',
  v13: 'sweetpatotes.jpg',
  v14: 'ginger.jpg',
  v15: 'mushrooms.jpg',
  f1: 'banana.jpg',
  f2: 'watermalon.jpg',
  f3: 'apple.jpg',
  f4: 'oranges.jpg',
  f5: 'kiwi.jpg',
  f6: 'strawberry.jpg',
  f7: 'mango.jpg',
  f8: 'pineapple.jpg',
  f9: 'papaya.jpg',
  f10: 'grappes.jpg',
  d1: 'amulgold.jpg',
  d2: 'almondmilk.jpg',
  d3: 'amulcream.jpg',
  d4: 'dahi.jpg',
  d5: 'mastidahi.jpg',
  d6: 'lassi.jpg',
  d7: 'whiteggs.jpg',
  d9: 'bread.jpg',
  d10: 'wholewheatbread.jpg',
  m1: 'sweetspicy.jpg',
  m2: 'indianmagicmasala.jpg',
  m3: 'hotandsweetchilli.jpg',
  m4: 'salted.jpg',
  m5: 'pringles.jpg',
  m6: 'doriotos.jpg',
  m7: 'pringlescreamandonion.jpg',
  m8: 'spicysweetchilli.jpg',
  m9: 'cheddarjalapenocheetos.jpg',
  m10: 'takis.jpg',
  m11: 'pringlesbbq.jpg',
  c1: 'cocacola.jpg',
  c2: 'pepsi.jpg',
  c3: 'sprite.jpg',
  c4: 'fanta.jpg',
  c5: 'fantaberry.jpg',
  c6: 'fantafruitpunch.jpg',
  c7: 'fantagrappe.jpg',
  c8: 'fantagreenapple.jpg',
  c9: 'mangojuice.jpg',
  c10: 'moggumoggu.jpg',
  c11: 'orangejuice.jpg',
  c12: 'pulpyorange.jpg',
  c13: 'tropicana.jpg',
  c14: 'cherryjuice.jpg',
  c15: 'blueberrdrink.jpg',
  n1: 'buldakblack.jpg',
  n2: 'buldakpink.jpg',
  n3: 'buldakyellow.jpg',
  n4: 'maggicuppa.jpg',
  n5: 'maggicurryfalvour.jpg',
  n6: 'poha.jpg',
  n7: 'upma.jpg',
  n8: 'yippe.jpg',
  b1: 'chocolatecookie.jpg',
  b2: 'desirebutter.jpg',
  b3: 'momsmagic.jpg',
  b4: 'fiftyfifty.jpg',
  b5: 'mariegold.jpg',
  b6: 'jimjam.jpg',
  b7: 'littlhearts.jpg',
  b8: 'milkbikis.jpg',
  b9: 'nutrichoice.jpg',
  b10: 'bourbon.jpg',
  b11: 'happyhappy.jpg',
  b12: 'hideandseek.jpg',
  b13: 'unibicchocolate.jpg',
  b14: 'unibicfruitandnut.jpg',
  b15: 'orio.jpg',
  b16: 'oreostrawberry.jpg',
  s1: 'cornettochoco.jpg',
  s2: 'cornettoblue.jpg',
  s3: 'mangum.jpg',
  s4: 'ferroro.jpg',
  s5: 'kitkatbiscoff.jpg',
  s6: 'kitkatcookiecrumble.jpg',
  s7: 'oreobites.jpg',
  s8: 'snickers.jpg',
  s9: 'toblerone.jpg',
  s10: 'twix.jpg',
  s11: 'kinderjoy.jpg',
  s12: 'mars.jpg',
  s13: 'bounty.jpg',
  s14: 'rafaello.jpg',
  ar1: 'aashirvadatta.jpg',
  ar2: 'bhogaata.jpg',
  ar3: 'dawatbrownrice.jpg',
  ar4: 'basmatirce.jpg',
  ar5: 'masoordal.jpg',
  ar6: 'moongdal.jpg',
  ar7: 'toordal.jpg',
  ar8: 'uraldal.jpg',
  ar9: 'masalaoats.jpg',
  sc1: 'barbeque.jpg',
  sc2: 'harsheystrawberry.jpg',
  sc3: 'hersheycarame;.jpg',
  sc4: 'hersheychoco.jpg',
  sc5: 'hotchilli.jpg',
  sc6: 'mayo.jpg',
  sc7: 'pastasauce.jpg',
  sc8: 'tandoorimayo.jpg',
  sc9: 'tomatobasil.jpg',
  sc10: 'tomatoketcup.jpg',
  sc11: 'yellowmustard.jpg',
  bc1: 'babyrub.jpg',
  bc2: 'johnsonaleopowder.jpg',
  bc3: 'johnsoncream.jpg',
  bc4: 'johnsonoil.jpg',
  bc5: 'johnsonpowder.jpg',
  bc6: 'johnsonwipes.jpg',
  bc7: 'pampersdiaper.jpg',
  bc8: 'pamperswipes.jpg',
};

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({ productKey: { $exists: true, $ne: '' } });
  console.log(`Found ${products.length} products with productKey`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const filename = KEY_TO_FILE[product.productKey];
    if (!filename) {
      console.log(`  SKIP: no mapping for productKey="${product.productKey}" (${product.name})`);
      skipped++;
      continue;
    }

    // Only update if images array is empty (don't overwrite admin-uploaded images)
    if (product.images && product.images.length > 0) {
      console.log(`  SKIP: ${product.name} already has ${product.images.length} image(s)`);
      skipped++;
      continue;
    }

    const url = `/uploads/products/${filename}`;
    product.images = [{ url, filename, order: 0 }];
    product.imageUrl = url;
    await product.save();
    updated++;
    console.log(`  OK: ${product.name} (${product.productKey}) → ${filename}`);
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
