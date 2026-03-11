'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { FaBox, FaShoppingCart, FaCreditCard, FaUsers, FaSignOutAlt } from 'react-icons/fa'
import '@/styles/navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const isActive = (path) => pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link href="/" className="navbar-logo">
            E-Commerce
          </Link>
          
          <div className="navbar-menu">
            <Link 
              href="/products" 
              className={`navbar-link ${isActive('/products')}`}
            >
              <FaBox />
              Products
            </Link>
            
            <Link 
              href="/orders" 
              className={`navbar-link ${isActive('/orders')}`}
            >
              <FaShoppingCart />
              Orders
            </Link>
            
            <Link 
              href="/payments" 
              className={`navbar-link ${isActive('/payments')}`}
            >
              <FaCreditCard />
              Payments
            </Link>
            
            {user.role === 'ADMIN' && (
              <Link 
                href="/users" 
                className={`navbar-link ${isActive('/users')}`}
              >
                <FaUsers />
                Users
              </Link>
            )}
          </div>

          <div className="navbar-right">
            <div className="navbar-user-info">
              <span>
                {user.username} ({user.role})
              </span>
            </div>

            <button
              onClick={logout}
              className="navbar-logout-btn"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
