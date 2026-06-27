import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartContext';
import { BASE_URL } from '../config/apiconfig';

const CATEGORY_META = {
  'Vegetables & Fruits': { light: '#E8F5E9' },
  'Dairy, Eggs & Bread': { light: '#FFFDE7' },
  Munchies: { light: '#FBE9E7' },
  'Cold Drinks & Juices': { light: '#E1F5FE' },
  'Noodles & Instant Food': { light: '#F3E5F5' },
  'Bakery & Biscuits': { light: '#FFF3E0' },
  'Sweet Tooth': { light: '#FCE4EC' },
  'Atta, Rice & Dal': { light: '#F1F8E9' },
  'Sauces & Spreads': { light: '#E8EAF6' },
  'Baby Care': { light: '#FCE4EC' },
};

const IMAGE_MAP = {
  v1: require('../assets/categories/vegetablefruits/tomato.jpg'),
  v2: require('../assets/categories/vegetablefruits/brinjles.jpg'),
  v3: require('../assets/categories/vegetablefruits/cabagge.jpg'),
  v4: require('../assets/categories/vegetablefruits/cauliflower.jpg'),
  v5: require('../assets/categories/vegetablefruits/brocolli.jpg'),
  v6: require('../assets/categories/vegetablefruits/onions.jpg'),
  v7: require('../assets/categories/vegetablefruits/potato.jpg'),
  v8: require('../assets/categories/vegetablefruits/garlic.jpg'),
  v9: require('../assets/categories/vegetablefruits/lemon.jpg'),
  v10: require('../assets/categories/vegetablefruits/beetroot.jpg'),
  v11: require('../assets/categories/vegetablefruits/carrots.jpg'),
  v12: require('../assets/categories/vegetablefruits/pumpkins.jpg'),
  v13: require('../assets/categories/vegetablefruits/sweetpatotes.jpg'),
  v14: require('../assets/categories/vegetablefruits/ginger.jpg'),
  v15: require('../assets/categories/vegetablefruits/mushrooms.jpg'),
  f1: require('../assets/categories/vegetablefruits/banana.jpg'),
  f2: require('../assets/categories/vegetablefruits/watermalon.jpg'),
  f3: require('../assets/categories/vegetablefruits/apple.jpg'),
  f4: require('../assets/categories/vegetablefruits/oranges.jpg'),
  f5: require('../assets/categories/vegetablefruits/kiwi.jpg'),
  f6: require('../assets/categories/vegetablefruits/strawberry.jpg'),
  f7: require('../assets/categories/vegetablefruits/mango.jpg'),
  f8: require('../assets/categories/vegetablefruits/pineapple.jpg'),
  f9: require('../assets/categories/vegetablefruits/papaya.jpg'),
  f10: require('../assets/categories/vegetablefruits/grappes.jpg'),
  d1: require('../assets/categories/dairy/amulgold.jpg'),
  d2: require('../assets/categories/dairy/almondmilk.jpg'),
  d3: require('../assets/categories/dairy/amulcream.jpg'),
  d4: require('../assets/categories/dairy/dahi.jpg'),
  d5: require('../assets/categories/dairy/mastidahi.jpg'),
  d6: require('../assets/categories/dairy/lassi.jpg'),
  d7: require('../assets/categories/dairy/whiteggs.jpg'),
  d9: require('../assets/categories/dairy/bread.jpg'),
  d10: require('../assets/categories/dairy/wholewheatbread.jpg'),
  m1: require('../assets/categories/Munchies/sweetspicy.jpg'),
  m2: require('../assets/categories/Munchies/indianmagicmasala.jpg'),
  m3: require('../assets/categories/Munchies/hotandsweetchilli.jpg'),
  m4: require('../assets/categories/Munchies/salted.jpg'),
  m5: require('../assets/categories/Munchies/pringles.jpg'),
  m6: require('../assets/categories/Munchies/doriotos.jpg'),
  m7: require('../assets/categories/Munchies/pringlescreamandonion.jpg'),
  m8: require('../assets/categories/Munchies/spicysweetchilli.jpg'),
  m9: require('../assets/categories/Munchies/cheddarjalapenocheetos.jpg'),
  m10: require('../assets/categories/Munchies/takis.jpg'),
  m11: require('../assets/categories/Munchies/pringlesbbq.jpg'),
  c1: require('../assets/categories/colddrinks/cocacola.jpg'),
  c2: require('../assets/categories/colddrinks/pepsi.jpg'),
  c3: require('../assets/categories/colddrinks/sprite.jpg'),
  c4: require('../assets/categories/colddrinks/fanta.jpg'),
  c5: require('../assets/categories/colddrinks/fantaberry.jpg'),
  c6: require('../assets/categories/colddrinks/fantafruitpunch.jpg'),
  c7: require('../assets/categories/colddrinks/fantagrappe.jpg'),
  c8: require('../assets/categories/colddrinks/fantagreenapple.jpg'),
  c9: require('../assets/categories/colddrinks/mangojuice.jpg'),
  c10: require('../assets/categories/colddrinks/moggumoggu.jpg'),
  c11: require('../assets/categories/colddrinks/orangejuice.jpg'),
  c12: require('../assets/categories/colddrinks/pulpyorange.jpg'),
  c13: require('../assets/categories/colddrinks/tropicana.jpg'),
  c14: require('../assets/categories/colddrinks/cherryjuice.jpg'),
  c15: require('../assets/categories/colddrinks/blueberrdrink.jpg'),
  n1: require('../assets/categories/instantfood/buldakblack.jpg'),
  n2: require('../assets/categories/instantfood/buldakpink.jpg'),
  n3: require('../assets/categories/instantfood/buldakyellow.jpg'),
  n4: require('../assets/categories/instantfood/maggicuppa.jpg'),
  n5: require('../assets/categories/instantfood/maggicurryfalvour.jpg'),
  n6: require('../assets/categories/instantfood/poha.jpg'),
  n7: require('../assets/categories/instantfood/upma.jpg'),
  n8: require('../assets/categories/instantfood/yippe.jpg'),
  b1: require('../assets/categories/biscuits/chocolatecookie.jpg'),
  b2: require('../assets/categories/biscuits/desirebutter.jpg'),
  b3: require('../assets/categories/biscuits/momsmagic.jpg'),
  b4: require('../assets/categories/biscuits/fiftyfifty.jpg'),
  b5: require('../assets/categories/biscuits/mariegold.jpg'),
  b6: require('../assets/categories/biscuits/jimjam.jpg'),
  b7: require('../assets/categories/biscuits/littlhearts.jpg'),
  b8: require('../assets/categories/biscuits/milkbikis.jpg'),
  b9: require('../assets/categories/biscuits/nutrichoice.jpg'),
  b10: require('../assets/categories/biscuits/bourbon.jpg'),
  b11: require('../assets/categories/biscuits/happyhappy.jpg'),
  b12: require('../assets/categories/biscuits/hideandseek.jpg'),
  b13: require('../assets/categories/biscuits/unibicchocolate.jpg'),
  b14: require('../assets/categories/biscuits/unibicfruitandnut.jpg'),
  b15: require('../assets/categories/biscuits/orio.jpg'),
  b16: require('../assets/categories/biscuits/oreostrawberry.jpg'),
  s1: require('../assets/categories/sweettooth/cornettochoco.jpg'),
  s2: require('../assets/categories/sweettooth/cornettoblue.jpg'),
  s3: require('../assets/categories/sweettooth/mangum.jpg'),
  s4: require('../assets/categories/sweettooth/ferroro.jpg'),
  s5: require('../assets/categories/sweettooth/kitkatbiscoff.jpg'),
  s6: require('../assets/categories/sweettooth/kitkatcookiecrumble.jpg'),
  s7: require('../assets/categories/sweettooth/oreobites.jpg'),
  s8: require('../assets/categories/sweettooth/snickers.jpg'),
  s9: require('../assets/categories/sweettooth/toblerone.jpg'),
  s10: require('../assets/categories/sweettooth/twix.jpg'),
  s11: require('../assets/categories/sweettooth/kinderjoy.jpg'),
  s12: require('../assets/categories/sweettooth/mars.jpg'),
  s13: require('../assets/categories/sweettooth/bounty.jpg'),
  s14: require('../assets/categories/sweettooth/rafaello.jpg'),
  ar1: require('../assets/categories/Attarice/aashirvadatta.jpg'),
  ar2: require('../assets/categories/Attarice/bhogaata.jpg'),
  ar3: require('../assets/categories/Attarice/dawatbrownrice.jpg'),
  ar4: require('../assets/categories/Attarice/basmatirce.jpg'),
  ar5: require('../assets/categories/Attarice/masoordal.jpg'),
  ar6: require('../assets/categories/Attarice/moongdal.jpg'),
  ar7: require('../assets/categories/Attarice/toordal.jpg'),
  ar8: require('../assets/categories/Attarice/uraldal.jpg'),
  ar9: require('../assets/categories/Attarice/masalaoats.jpg'),
  sc1: require('../assets/categories/sauces/barbeque.jpg'),
  sc2: require('../assets/categories/sauces/harsheystrawberry.jpg'),
  sc3: require('../assets/categories/sauces/hersheycarame;.jpg'),
  sc4: require('../assets/categories/sauces/hersheychoco.jpg'),
  sc5: require('../assets/categories/sauces/hotchilli.jpg'),
  sc6: require('../assets/categories/sauces/mayo.jpg'),
  sc7: require('../assets/categories/sauces/pastasauce.jpg'),
  sc8: require('../assets/categories/sauces/tandoorimayo.jpg'),
  sc9: require('../assets/categories/sauces/tomatobasil.jpg'),
  sc10: require('../assets/categories/sauces/tomatoketcup.jpg'),
  sc11: require('../assets/categories/sauces/yellowmustard.jpg'),
  bc1: require('../assets/categories/babycare/babyrub.jpg'),
  bc2: require('../assets/categories/babycare/johnsonaleopowder.jpg'),
  bc3: require('../assets/categories/babycare/johnsoncream.jpg'),
  bc4: require('../assets/categories/babycare/johnsonoil.jpg'),
  bc5: require('../assets/categories/babycare/johnsonpowder.jpg'),
  bc6: require('../assets/categories/babycare/johnsonwipes.jpg'),
  bc7: require('../assets/categories/babycare/pampersdiaper.jpg'),
  bc8: require('../assets/categories/babycare/pamperswipes.jpg'),
};

const groupByCategory = items => {
  const map = {};

  items.forEach(item => {
    const cat = item.category || 'Other';

    if (!map[cat]) {
      map[cat] = [];
    }

    map[cat].push(item);
  });

  return Object.entries(map).map(([categoryName, catItems]) => ({
    categoryName,
    previewItems: catItems.slice(0, 2),
    extra: Math.max(0, catItems.length - 2),
  }));
};

const FreqCategoryCard = ({
  categoryName,
  previewItems,
  extra,
  onPress,
}) => {
  const meta = CATEGORY_META[categoryName] ?? { light: '#F0F0F0' };

  return (
    <TouchableOpacity
      style={[styles.freqCard, { backgroundColor: meta.light }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.freqImages}>
        {previewItems.map((item, i) => (
          <View key={i} style={styles.freqImgBox}>
            {IMAGE_MAP[item.productKey] ? (
              <Image
                source={IMAGE_MAP[item.productKey]}
                style={styles.freqImg}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.freqFallback}>
                {item.name?.[0] ?? '?'}
              </Text>
            )}
          </View>
        ))}
      </View>

      {extra > 0 && (
        <Text style={styles.freqMore}>+{extra} more</Text>
      )}

      <Text style={styles.freqName} numberOfLines={2}>
        {categoryName}
      </Text>
    </TouchableOpacity>
  );
};

const PrevItemCard = ({
  item,
  quantity,
  onAdd,
  onRemove,
}) => {
  const image = IMAGE_MAP[item.productKey];

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemImgBox}>
        {image ? (
          <Image
            source={image}
            style={styles.itemImg}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.itemFallback}>
            {item.name?.[0] ?? '?'}
          </Text>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.itemUnit}>
          {item.unit || '1 pc'}
        </Text>

        <Text style={styles.itemPrice}>
          ₹{item.price}
        </Text>
      </View>

      {quantity === 0 ? (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAdd(item)}
          activeOpacity={0.75}
        >
          <Text style={styles.addBtnText}>ADD</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onRemove(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qtyNum}>
            {quantity}
          </Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onAdd(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const EmptyState = ({ onBrowse }) => (
  <View style={styles.emptyWrap}>
    <Feather
      name="shopping-bag"
      size={52}
      color="#D0D5DD"
    />

    <Text style={styles.emptyTitle}>
      No orders yet
    </Text>

    <Text style={styles.emptySub}>
      Place your first order and your items
      will appear here for easy reordering
    </Text>

    <TouchableOpacity
      style={styles.browseBtn}
      onPress={onBrowse}
      activeOpacity={0.8}
    >
      <Text style={styles.browseBtnText}>
        Browse Categories
      </Text>
    </TouchableOpacity>
  </View>
);

const OrderAgainScreen = ({ navigation }) => {
  const { cart, addItem, removeItem } = useCart();

  const [loading, setLoading] = useState(true);
  const [prevItems, setPrevItems] = useState([]);
  const [freqCategories, setFreqCategories] =
    useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem(
          'token',
        );

        const res = await fetch(
          `${BASE_URL}/orders/myorders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        console.log(
          'ORDER AGAIN API:',
          JSON.stringify(data, null, 2),
        );

        if (
          data.success &&
          Array.isArray(data.data)
        ) {
          const allItems = data.data.flatMap(order =>
            order.orderItems.map(i => ({
              _id: i.product?._id || i._id || i.productId,
              productKey: i.product?.productKey || i.productKey,
              name: i.product?.name || i.name,
              price: i.price,
              unit: i.product?.unit || i.unit,
              category: i.categoryName || i.category,
            }))
          );

          console.log('ITEM KEYS:', allItems.slice(0, 5).map(i => ({
            name: i.name,
            productKey: i.productKey,
          })));

          const seen = new Set();

          const unique = allItems.filter(item => {
            const key =
              item.productKey ||
              item._id ||
              item.name;

            if (seen.has(key)) {
              return false;
            }

            seen.add(key);

            return true;
          });

          setPrevItems(unique);
          setFreqCategories(
            groupByCategory(unique),
          );
        }
      } catch (err) {
        console.log(
          'OrderAgainScreen error:',
          err,
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAdd = useCallback(
    item => {
      addItem({
        ...item,
        id:
          item.productKey ||
          item._id ||
          item.name,
      });
    },
    [addItem],
  );

  const handleRemove = useCallback(
    item => {
      removeItem(
        item.productKey ||
        item._id ||
        item.name,
      );
    },
    [removeItem],
  );

  const getQty = item => {
    const key =
      item.productKey ||
      item._id ||
      item.name;

    return cart[key] ?? 0;
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={{ marginTop: 80 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F2F0EF"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 32,
        }}
      >
        <View style={styles.header}>

          <Text style={styles.pageTitle}>
            Order Again
          </Text>
        </View>

        {prevItems.length === 0 ? (
          <EmptyState
            onBrowse={() =>
              navigation
                .getParent()
                ?.navigate('Categories')
            }
          />
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Frequently Bought
            </Text>

            <View style={styles.freqGrid}>
              {freqCategories.map(cat => (
                <FreqCategoryCard
                  key={cat.categoryName}
                  categoryName={
                    cat.categoryName
                  }
                  previewItems={
                    cat.previewItems
                  }
                  extra={cat.extra}
                  onPress={() =>
                    navigation.navigate(
                      'CategoryProductScreen',
                      {
                        categoryName:
                          cat.categoryName,
                      },
                    )
                  }
                />
              ))}
            </View>

            <View style={styles.prevHeader}>
              <Text
                style={styles.sectionTitle}
              >
                Previously Bought
              </Text>

              <Text style={styles.prevCount}>
                {prevItems.length} items
              </Text>
            </View>

            <View style={styles.prevList}>
              {prevItems.map(item => (
                <PrevItemCard
                  key={
                    item.productKey ||
                    item._id
                  }
                  item={item}
                  quantity={getQty(item)}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0EF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },

  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  prevHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 20,
    marginTop: 8,
  },

  prevCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AAB4',
  },

  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 28,
  },

  freqCard: {
    width: '47%',
    borderRadius: 18,
    padding: 12,
  },

  freqImages: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },

  freqImgBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  freqImg: {
    width: 48,
    height: 48,
  },

  freqFallback: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ccc',
  },

  freqMore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777',
    marginBottom: 4,
  },

  freqName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.2,
    lineHeight: 18,
  },

  prevList: {
    paddingHorizontal: 20,
  },

  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  itemImgBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },

  itemImg: {
    width: 56,
    height: 56,
  },

  itemFallback: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ccc',
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.2,
    marginBottom: 2,
  },

  itemUnit: {
    fontSize: 11,
    color: '#A0AAB4',
    fontWeight: '500',
    marginBottom: 5,
  },

  itemPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.4,
  },

  addBtn: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexShrink: 0,
  },

  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: 0.5,
  },

  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },

  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  qtyBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4CAF50',
    lineHeight: 22,
  },

  qtyNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4CAF50',
    minWidth: 20,
    textAlign: 'center',
  },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: -0.4,
  },

  emptySub: {
    fontSize: 13,
    color: '#A0AAB4',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  browseBtn: {
    marginTop: 24,
    backgroundColor: '#111',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },

  browseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

export default OrderAgainScreen;