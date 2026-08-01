import React, { useEffect, useState, useRef , useContext} from 'react';
import logo from '../../assets/images/logo.png';
import { NavLink, Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { MenuIcon  } from 'lucide-react';
import 'remixicon/fonts/remixicon.css';
import { authContext } from '../../context/AuthContext.jsx';



const navLinks = [
  {
    path: '/home',
    display: 'Home',
  },
  {
    path: '/doctors',
    display: 'Find a Doctor',
  },
  {
    path: '/services',
    display: 'Services',
  },
  {
    path: '/contact',
    display: 'Contact',
  },
];

function Header() {
  const [isSticky, setIsSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const {user , role , token } = useContext(authContext)

  // Sticky header logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close menu when a link is clicked
  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <header
      className={`header flex items-center ${
        isSticky ? "sticky top-0 z-50 transition-all shadow-md " : "relative"
      } bg-white`}
    >
      <div className="container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div>
            <img src={logo} alt="Logo" />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-11">
            <ul className="menu flex items-center gap-11">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <NavLink
                    to={link.path}
                    className={(navClass) =>
                      navClass.isActive
                        ? "text-primaryColor text-[16px] leading-7 font-[600]"
                        : "text-textColor text-[16px] leading-7 font-[500]"
                    }
                    onClick={handleLinkClick} // Close menu on click
                  >
                    {link.display}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right side with login and menu button */}
          <div className="flex items-center gap-4">
          {token && user ? (
             <div>
             <Link
               to={`${
                 role === "doctor" ? "/doctors/profile/me" : "/users/profile/me"
               }`}
             >
               <figure className="w-[35px] h-[35px] rounded-full overflow-hidden cursor-pointer">
                 <img
                   src={user?.photo}
                   className="w-full h-full object-cover"
                   alt="User"
                 />
               </figure>
             </Link>
           </div>
           
            ) : (
              <Link to="/login">
                <Button className="py-2 px-6 font-[600]">Login</Button>
              </Link>
            )}
            <span
              className="md:hidden cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)} // Toggle mobile menu
            >
              <MenuIcon className="w-6 h-6" />
            </span>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          ref={menuRef}
          className={`fixed top-0 right-0 w-[190px] h-full bg-white shadow-lg md:hidden z-50 transition-transform duration-300 ease-in-out transform dark:bg-[#191f26] ${
            menuOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          }`}
        >
          <div className="relative w-full h-full flex flex-col">
            <span
              className="absolute top-4 right-4 text-2xl text-black cursor-pointer transition-all duration-300 ease-out"
              onClick={() => setMenuOpen(false)} // Close menu
            >
              <i className="ri-close-line"></i>
            </span>
            <div className="flex flex-col items-center justify-center h-full mt-16">
              {navLinks.map((link, index) => (
                <NavLink
                  key={index}
                  to={link.path}
                  className={({ isActive }) =>
                    `duration-200 ${
                      isActive
                        ? "text-primaryColor font-semibold"
                        : "text-smallTextColor dark:text-white"
                    } py-4`
                  }
                  onClick={handleLinkClick} // Close menu on click
                >
                  {link.display}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
