const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

class InventoryService {
  // Create product
  async createProduct(productData) {
    try {
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }

      const product = new Product(productData);
      await product.save();
      return product;
    } catch (error) {
      throw error;
    }
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw error;
    }
  }

  // Get all products
  async getAllProducts() {
    try {
      return await Product.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Get products by category
  async getProductsByCategory(category) {
    try {
      return await Product.find({ category }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  // Update product
  async updateProduct(productId, updateData) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      const product = await Product.findByIdAndDelete(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Check stock availability (for inter-service communication)
  async checkStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        return {
          available: false,
          message: 'Product not found',
          productId
        };
      }

      if (!product.available) {
        return {
          available: false,
          message: 'Product is not available',
          productId,
          productName: product.name
        };
      }

      const availableQuantity = product.quantity - product.reservedQuantity;
      
      if (availableQuantity < quantity) {
        return {
          available: false,
          message: 'Insufficient stock',
          productId,
          productName: product.name,
          requestedQuantity: quantity,
          availableQuantity
        };
      }

      return {
        available: true,
        message: 'Stock available',
        productId,
        productName: product.name,
        price: product.price,
        requestedQuantity: quantity,
        availableQuantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Reserve stock (for order processing)
  async reserveStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      const availableQuantity = product.quantity - product.reservedQuantity;
      
      if (availableQuantity < quantity) {
        throw new Error('Insufficient stock to reserve');
      }

      product.reservedQuantity += quantity;
      await product.save();

      return {
        success: true,
        message: 'Stock reserved successfully',
        productId,
        reservedQuantity: quantity,
        totalReserved: product.reservedQuantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Confirm stock (deduct from inventory after payment)
  async confirmStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.reservedQuantity < quantity) {
        throw new Error('Reserved quantity mismatch');
      }

      product.quantity -= quantity;
      product.reservedQuantity -= quantity;
      await product.save();

      return {
        success: true,
        message: 'Stock confirmed and deducted',
        productId,
        deductedQuantity: quantity,
        remainingQuantity: product.quantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Release reserved stock (if order fails)
  async releaseStock(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      product.reservedQuantity = Math.max(0, product.reservedQuantity - quantity);
      await product.save();

      return {
        success: true,
        message: 'Reserved stock released',
        productId,
        releasedQuantity: quantity
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload product image to Cloudinary
  async uploadProductImage(productId, file) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Delete old image if exists
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }

      // Upload new image
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'ecommerce-products',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      // Update product with new image URL
      product.imageUrl = result.secure_url;
      product.imagePublicId = result.public_id;
      await product.save();

      return {
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: product.imageUrl,
        product
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete product image from Cloudinary
  async deleteProductImage(productId) {
    try {
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.imagePublicId) {
        throw new Error('Product has no image to delete');
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(product.imagePublicId);

      // Remove from product
      product.imageUrl = null;
      product.imagePublicId = null;
      await product.save();

      return {
        success: true,
        message: 'Image deleted successfully',
        product
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InventoryService();
