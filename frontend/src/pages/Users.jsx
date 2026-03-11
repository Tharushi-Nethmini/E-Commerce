import React, { useEffect, useState } from 'react'
import { getAllUsers, deleteUser, updateUser } from '../api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({})

  const load = async () => {
    try {
      const { data } = await getAllUsers()
      setUsers(data)
    } catch {
      showAlert('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await deleteUser(id)
      showAlert('User deleted')
      load()
    } catch {
      showAlert('Delete failed', 'error')
    }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ fullName: u.fullName, phone: u.phone, address: u.address, role: u.role })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateUser(editUser.id, form)
      showAlert('User updated')
      setEditUser(null)
      load()
    } catch {
      showAlert('Update failed', 'error')
    }
  }

  const ROLE_COLORS = { ADMIN: '#ef4444', CUSTOMER: '#3b82f6', VENDOR: '#10b981' }

  return (
    <div className="page">
      <div className="page-header">
        <h2>👥 User Management</h2>
        <span className="text-muted">{users.length} users registered</span>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className="role-badge" style={{ background: ROLE_COLORS[u.role] || '#6b7280' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-dot ${u.active ? 'active' : 'inactive'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(u)}>Edit</button>
                    {' '}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User: {editUser.username}</h3>
              <button className="modal-close" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VENDOR">VENDOR</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
