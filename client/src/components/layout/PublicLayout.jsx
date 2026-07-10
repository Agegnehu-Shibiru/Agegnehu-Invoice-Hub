import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { Menu, X, Receipt, ChevronRight } from 'lucide-react';

export default function PublicLayout() {
  const { isAuthenticated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/blog', label: 'Blog' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Receipt size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900">Invoice<span className="text-primary-600">Hub</span></span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">Dashboard →</Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">Log in</Link>
                  <Link to="/register" className="btn-primary">Get Started Free</Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden ml-auto p-2 rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-primary-600 rounded-lg hover:bg-slate-50">{label}</NavLink>
              ))}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn-primary w-full justify-center">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary w-full justify-center">Log in</Link>
                    <Link to="/register" className="btn-primary w-full justify-center">Get Started Free</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1"><Outlet /></main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Receipt size={16} className="text-white" />
                </div>
                <span className="font-bold text-white text-lg">InvoiceHub Pro</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">Professional invoicing built for freelancers and small businesses. Get paid faster.</p>
            </div>
            {[
              { title: 'Product', links: [['Pricing', '/pricing'], ['Features', '/#features'], ['Blog', '/blog']] },
              { title: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Careers', '/career']] },
              { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms'], ['Security', '/security']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-sm font-semibold text-white mb-4">{title}</p>
                <ul className="space-y-2">
                  {links.map(([label, href]) => (
                    <li key={label}><Link to={href} className="text-sm hover:text-white transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© {new Date().getFullYear()} InvoiceHub Pro. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
              <Link to="/career" className="hover:text-white">Careers</Link>
              <Link to="/security" className="hover:text-white">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}