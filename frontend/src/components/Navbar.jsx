import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link ${location.pathname === to ? 'nav-link-active' : ''}`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/products">🛒 ShopEasy</Link>
      </div>
      <div className="navbar-links">
        {navLink('/products', '🛍️ Products')}
        {navLink('/orders', '📦 Orders')}
        {navLink('/payments', '💳 Payments')}
        {isAdmin && navLink('/users', '👥 Users')}
      </div>
      <div className="navbar-user">
        <span className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-role-tag" data-role={user?.role}>{user?.role}</span>
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
