'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  FaHome, FaBox, FaShoppingCart, FaCreditCard, FaUsers,
  FaSignOutAlt, FaUserCircle, FaChartBar, FaStore
} from 'react-icons/fa'
import '@/styles/navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const isActive = (path) => pathname === path ? 'active' : ''
  const isAdmin = user.role === 'ADMIN'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link href={isAdmin ? '/analytics' : '/home'} className="navbar-logo">
            <FaStore className="navbar-logo-icon" />
            <span>NexMart</span>
          </Link>

          <div className="navbar-menu">
            {/* Admin: Analytics first */}
            {isAdmin && (
              <Link href="/analytics" className={`navbar-link ${isActive('/analytics')}`}>
                <FaChartBar />
                <span>Analytics</span>
              </Link>
            )}

            {/* User: Home first */}
            {!isAdmin && (
              <Link href="/home" className={`navbar-link ${isActive('/home')}`}>
                <FaHome />
                <span>Home</span>
              </Link>
            )}

            <Link href="/products" className={`navbar-link ${isActive('/products')}`}>
              <FaBox />
              <span>Products</span>
            </Link>

            <Link href="/orders" className={`navbar-link ${isActive('/orders')}`}>
              <FaShoppingCart />
              <span>Orders</span>
            </Link>

            <Link href="/payments" className={`navbar-link ${isActive('/payments')}`}>
              <FaCreditCard />
              <span>Payments</span>
            </Link>

            {!isAdmin && (
              <Link href="/cart" className={`navbar-link ${isActive('/cart')}`}>
                <FaShoppingCart />
                <span>Cart</span>
              </Link>
            )}

            {isAdmin && (
              <Link href="/users" className={`navbar-link ${isActive('/users')}`}>
                <FaUsers />
                <span>Users</span>
              </Link>
            )}
          </div>

          <div className="navbar-right">
            <Link href="/profile" className={`navbar-profile-link ${isActive('/profile')}`}>
              <FaUserCircle />
              <span>{user.username}</span>
            </Link>

            <button onClick={logout} className="navbar-logout-btn">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
