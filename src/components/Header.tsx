'use client'
import Image from 'next/image'
import Link from 'next/link'

const Header = () => {
  return (
    <div id="ctl00_headerDiv" className="header-purple">
      <div id="leftDiv" className="headerLeftDiv">
       
      </div>
      
      <span id="imgText" className="headerImgText">İnternet Şubesi</span>
      
      <div className="top_nav" style={{ display: 'none' }}>
        <div>
          {/* Navigation items can be added here if needed */}
        </div>
      </div>

      <style jsx>{`
        .header-purple {
          background: linear-gradient(135deg, #4a148c 0%, #8e24aa 100%);
          width: 100%;
          height: 80px;
          position: relative;
          display: flex;
          align-items: center;
          padding: 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .headerLeftDiv {
          position: absolute;
          left: 0;
          top: 0;
          width: 280px;
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0;
          margin: 0;
        }

        .headerImgText {
          position: absolute;
          right: 20px;
          color: white;
          font-size: 18px;
          font-weight: 600;
          font-family: 'Arial', sans-serif;
          z-index: 10;
        }

        .top_nav {
          display: none;
        }

        @media (max-width: 768px) {
          .header-purple {
            height: 50px;
          }
          
          .headerLeftDiv {
            width: 160px;
            
          
          }
          
          .headerImgText {
            font-size: 16px;
            right: 15px;
          }
        }
      `}</style>
    </div>
  )
}

export default Header