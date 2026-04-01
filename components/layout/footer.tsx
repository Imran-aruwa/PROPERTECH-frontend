// components/layout/Footer.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-14 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center mb-4">
            <Image
              src="/logo.png"
              alt="ProperTech Software"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>

          <p className="text-tx-muted mb-6">Modern property management software built for the next generation of landlords and property managers.</p>

          <div className="flex gap-3">
            <a className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700">𝕏</a>
            <a className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700">in</a>
            <a className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700">f</a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Product</h4>
          <ul className="space-y-3 text-tx-muted text-sm">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="#waitlist" className="hover:text-white">Waitlist</a></li>
            <li><a href="#" className="hover:text-white">Roadmap</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Company</h4>
          <ul className="space-y-3 text-tx-muted text-sm">
            <li><a href="#" className="hover:text-white">About Us</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Legal</h4>
          <ul className="space-y-3 text-tx-muted text-sm">
            <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">Security</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-10 pt-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-tx-muted text-sm">© {new Date().getFullYear()} PROPERTECH. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-tx-muted mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Status</a>
            <a href="#" className="hover:text-white">API Docs</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
