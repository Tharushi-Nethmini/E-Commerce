import React, { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api'
import { useAuth } from '../context/AuthContext'

const empty = { name: '', sku: '', price: '', stockQuantity: '', category: '', description: '' }

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(empty)
  const [alert, setAlert] = useState(null)

  const load = async () => {
    try {
      const { data } = await getProducts()
      setProducts(data)
    } catch {
      showAlert('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 3000)
  }

  const openCreate = () => { setForm(empty); setEditItem(null); setShowModal(true) }
  const openEdit = (p) => { setForm({ ...p }); setEditItem(p); setShowModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editItem) {
        await updateProduct(editItem.id, form)
        showAlert('Product updated')
      } else {
        await createProduct(form)
        showAlert('Product created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      showAlert(err.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await deleteProduct(id)
      showAlert('Product deleted')
      load()
    } catch {
      showAlert('Delete failed', 'error')
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="page">
      <div className="page-header">
        <h2>🛍️ Products</h2>
        <div className="page-actions">
          <input
            className="search-input"
            placeholder="Search by name, category, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isAdmin && (
            <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
          )}
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className="product-grid">
          {filtered.length === 0 && <p className="empty-msg">No products found.</p>}
          {filtered.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-badge">{p.category || 'General'}</div>
              <h3>{p.name}</h3>
              <p className="product-sku">SKU: {p.sku}</p>
              {p.description && <p className="product-desc">{p.description}</p>}
              <div className="product-footer">
                <span className="product-price">Rs. {Number(p.price).toLocaleString()}</span>
                <span className={`stock-badge ${p.stockQuantity > 0 ? 'in-stock' : 'out-stock'}`}>
                  {p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out of stock'}
                </span>
              </div>
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={set('name')} required />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input value={form.sku} onChange={set('sku')} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (Rs.) *</label>
                  <input type="number" value={form.price} onChange={set('price')} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Stock Qty *</label>
                  <input type="number" value={form.stockQuantity} onChange={set('stockQuantity')} required min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input value={form.category} onChange={set('category')} />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
