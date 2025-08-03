"use client";

import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-[#E8E2DB] text-[#333] px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
          <span>Her hakkı QNB Bank A.Ş.'ye aittir. © 2025</span>
          <span className="text-gray-500">|</span>
          <Link href="#" className="hover:text-[#800D51] transition-colors">
            English
          </Link>
          <span className="text-gray-500">|</span>
          <Link href="#" className="hover:text-[#800D51] transition-colors">
            Yapabileceğiniz İşlemler
          </Link>
          <span className="text-gray-500">|</span>
          <Link href="#" className="hover:text-[#800D51] transition-colors">
            Sıkça Sorulan Sorular
          </Link>
          <span className="text-gray-500">|</span>
          <Link href="#" className="hover:text-[#800D51] transition-colors">
            Bize Ulaşın
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer