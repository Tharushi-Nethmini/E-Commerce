'use client'
import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { FaPlus, FaEdit, FaTrash, FaImage, FaShoppingCart } from 'react-icons/fa'
import '@/styles/products.css'

function ProductsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    sku: ''
  })

  useEffect(() => {
    fetchProducts()
    const interval = setInterval(fetchProducts, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`)
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let productId
      if (editingProduct) {
        const response = await api.put(
          `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${editingProduct.id}`,
          formData
        )
        productId = editingProduct.id
      } else {
        const response = await api.post(
          `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products`,
          formData
        )
        productId = response.data.id || response.data._id
      }

      // Upload image if selected
      if (imageFile && productId) {
        await uploadImage(productId)
      }

      setShowModal(false)
      setEditingProduct(null)
      setFormData({ name: '', description: '', price: '', quantity: '', category: '', sku: '' })
      setImageFile(null)
      setImagePreview(null)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert(error.response?.data?.message || 'Failed to save product')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const uploadImage = async (productId) => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('image', imageFile)
      
      await api.post(
        `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${productId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const deleteImage = async (productId) => {
    try {
      await api.delete(
        `${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${productId}/image`
      )
      fetchProducts()
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      sku: product.sku
    })
    setImageFile(null)
    setImagePreview(product.imageUrl || null)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`${process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE}/api/inventory/products/${id}`)
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      }
    }
  }

  const handleAddToCart = async (product) => {
    try {
      const userId = user?._id || user?.id
      await api.post(`${process.env.NEXT_PUBLIC_API_ORDER_SERVICE}/api/cart/add`, {
        userId,
        productId: product.id || product._id,
        quantity: 1
      })
      alert(`"${product.name}" added to cart!`)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add to cart')
    }
  }

  if (loading) {
    return <div className="products-loading">Loading products...</div>
  }

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="products-header">
        <div>
          <h1 className="products-title">Products</h1>
          {!isAdmin && (
            <p className="text-gray-600 mt-1">Browse our product catalog</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingProduct(null)
              setFormData({ name: '', description: '', price: '', quantity: '', category: '', sku: '' })
              setImageFile(null)
              setImagePreview(null)
              setShowModal(true)
            }}
            className="products-add-btn"
          >
            <FaPlus />
            Add Product
          </button>
        )}
      </div>

      <div className="page-search-wrap">
        <input
          type="text"
          className="page-search-input"
          placeholder="Search by name, category, or SKU…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            {product.imageUrl && (
              <div className="product-image-container">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="product-image"
                />
              </div>
            )}
            {!product.imageUrl && (
              <div className="product-image-container">
                <div className="product-image-placeholder">
                  <FaImage />
                </div>
              </div>
            )}
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-details">
                <p>
                  <span className="product-detail-label">Price</span>
                  <span className="product-detail-value price">Rs. {product.price?.toLocaleString()}</span>
                </p>
                <p>
                  <span className="product-detail-label">Stock</span>
                  <span className={`product-detail-value ${product.quantity <= 10 ? 'low-stock' : ''}`}>
                    {product.quantity} units
                  </span>
                </p>
                <p>
                  <span className="product-detail-label">Category</span>
                  <span className="product-detail-value">{product.category}</span>
                </p>
                <p>
                  <span className="product-detail-label">SKU</span>
                  <span className="product-detail-value sku">{product.sku}</span>
                </p>
              </div>
              {isAdmin ? (
                <div className="product-actions">
                  <button
                    onClick={() => handleEdit(product)}
                    className="product-edit-btn"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="product-delete-btn"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              ) : (
                <div className="product-actions">
                  {product.available && product.quantity > 10 ? (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="product-cart-btn"
                    >
                      <FaShoppingCart />
                      Add to Cart
                    </button>
                  ) : (
                    <span className="product-stock-badge">
                      {product.quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="product-modal-overlay">
          <div className="product-modal">
            <div className="product-modal-header">
              <h2 className="product-modal-title">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="product-modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="product-modal-form">
              <div className="product-form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="product-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="product-form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="product-form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="product-form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className="product-form-group">
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="product-form-group">
                <label>Product Image</label>
                <div className="product-image-zone">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="product-image-preview"
                    />
                  ) : (
                    <div className="product-image-zone-placeholder">
                      <span>🖼</span>
                      <span className="product-image-zone-label">Click to upload image</span>
                      <span className="product-image-zone-sub">JPG, PNG, GIF — max 5MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="product-modal-actions">
                <button type="submit" className="product-modal-submit" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading...' : editingProduct ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="product-modal-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  )
}
