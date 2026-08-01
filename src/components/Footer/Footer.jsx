import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/images/logo.png'
import {Linkedin ,Github ,Instagram } from 'lucide-react'

const socialLinks = [
  {
    path: "",
    icon: <Github className='group-hover:text-white  w-6 h-7'/>,
  },
  {
    path: "",
    icon: <Instagram className='group-hover:text-white  w-6 h-7'/>,
  },
  {
    path: "",
    icon: <Linkedin className='group-hover:text-white  w-6 h-7'/>,
  },
]

const quickLinks01 = [
  {
    path: "/home",
    display: "Home",
  },
  {
    path: "/",
    display: "About Us",
  },
  {
    path: "/services",
    display: "Services",
  },
  {
    path: "/",
    display: "Blog",
  },
];
const quickLinks02 = [
  {
    path: "/find a doctor",
    display: "Find a Doctor",
  },
  {
    path: "/",
    display: "Request an Appointment",
  },
  {
    path: "/",
    display: "Find a Location",
  },
  {
    path: "/",
    display: "Get a Opinion",
  },
];

const support =[
  {
    path: "/",
    display: "Donate",
    },
    {
      path: "/",
      display:"Contact Us"
    },
]
function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className=''>
      <div className="container pb-16 pt-10">
        <div className="flex justify-between flex-col md:flex-row flex-wrap gap-[30px]">
          <div>
            <img src={logo} alt="" />
            <p className="text-sm text-gray-500 mt-4">
              Copyright &copy; {year} developed bg Ayush Kumar all rights
              reserved
            </p>
            <div className="flex items-center  gap-3 mt-4">
              {socialLinks.map((link, index) => (
                <Link
                  to={link.path}
                  key={index}
                  className="text-primaryColor  hover:text-[#6ca5fb]"
                >
                  {link.icon}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg text-gray-900 font-bold">Quick Links</h3>
            <ul className="flex flex-col gap-2 mt-4">
              {quickLinks01.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    {link.display}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg text-gray-900 font-bold">I want to</h3>
            <ul className="flex flex-col gap-2 mt-4">
              {quickLinks02.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    {link.display}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg text-gray-900 font-bold">Support</h3>
            <ul className="flex flex-col gap-2 mt-4">
              {support.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    {link.display}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer

