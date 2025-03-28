import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { ShoppingCart, Star } from 'lucide-react-native';

const products = [
  {
    id: 1,
    name: 'Blue Light Glasses',
    price: 79.99,
    rating: 4.8,
    reviews: 245,
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=400&h=300&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Eye Drops Pro',
    price: 24.99,
    rating: 4.9,
    reviews: 189,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=400&h=300&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Vision Care Kit',
    price: 149.99,
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=400&h=300&auto=format&fit=crop',
  },
];

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.subtitle}>Shop eye care products</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>${product.price}</Text>
                
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.rating}>{product.rating}</Text>
                  <Text style={styles.reviews}>({product.reviews})</Text>
                </View>

                <TouchableOpacity style={styles.addButton}>
                  <ShoppingCart size={20} color="#ffffff" />
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: 200,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  productPrice: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#007AFF',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginLeft: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});