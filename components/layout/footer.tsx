// components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-14 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="20" fill="#1A89FF"/>
              <rect x="30" y="30" width="12" height="12" rx="3" fill="white"/>
              <rect x="48" y="30" width="12" height="12" rx="3" fill="white"/>
              <rect x="30" y="48" width="12" height="12" rx="3" fill="white"/>
            </svg>
            <div>
              <div className="text-lg font-bold">PROPERTECH</div>
              <div className="text-xs text-gray-400">Smarter Property Management</div>
            </div>
          </div>

          <p className="text-gray-400 mb-6">Modern property management software built for the next generation of landlords and property managers.</p>

          <div className="flex gap-3">
            <a className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700">𝕏</a>
            <a className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700">in</a>
            <a className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700">f</a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Product</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="#waitlist" className="hover:text-white">Waitlist</a></li>
            <li><a href="#" className="hover:text-white">Roadmap</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Company</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Legal</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">Security</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-10 pt-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} PROPERTECH. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Status</a>
            <a href="#" className="hover:text-white">API Docs</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
