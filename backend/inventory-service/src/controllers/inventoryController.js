const inventoryService = require('../services/inventoryService');

class InventoryController {
  // Create product
  async createProduct(req, res) {
    try {
      const product = await inventoryService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const product = await inventoryService.getProductById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Get all products or by category
  async getAllProducts(req, res) {
    try {
      const { category } = req.query;
      const products = category
        ? await inventoryService.getProductsByCategory(category)
        : await inventoryService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const product = await inventoryService.updateProduct(req.params.id, req.body);
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete product
  async deleteProduct(req, res) {
    try {
      const result = await inventoryService.deleteProduct(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  // Check stock (inter-service endpoint)
  async checkStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.checkStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Reserve stock (inter-service endpoint)
  async reserveStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.reserveStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Confirm stock (inter-service endpoint)
  async confirmStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.confirmStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Release stock (inter-service endpoint)
  async releaseStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const result = await inventoryService.releaseStock(productId, quantity);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Upload product image
  async uploadProductImage(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const result = await inventoryService.uploadProductImage(id, req.file);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete product image
  async deleteProductImage(req, res) {
    try {
      const { id } = req.params;
      const result = await inventoryService.deleteProductImage(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      const threshold = parseInt(req.query.threshold) || 10;
      const products = await inventoryService.getLowStockProducts(threshold);
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new InventoryController();
