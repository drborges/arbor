import React from "react"
import { Link, NavLink } from "react-router-dom"

export default function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <NavLink activeClassName="nav-active" to="/welcome">
            Home
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="nav-active" to="/users">
            Users
          </NavLink>
        </li>
        <li>
          <NavLink activeClassName="nav-active" to="/articles">
            Articles
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
