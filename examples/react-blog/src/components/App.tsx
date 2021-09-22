import React from "react"
import { createBrowserHistory } from "history"
import { Redirect, Route, Router, Switch } from "react-router-dom"
import Articles from "./Articles"
import Navbar from "./Navbar"
import Users from "./Users"
import Article from "./Article"
import Home from "./Home"

export default function App() {
  return (
    <Router history={createBrowserHistory()}>
      <div className="app">
        <Navbar />
        <Switch>
          <Route exact path="/">
            <Redirect to="/welcome" />
          </Route>
          <Route exact path="/welcome">
            <Home />
          </Route>
          <Route exact path="/users">
            <Users />
          </Route>
          <Route exact path="/articles">
            <Articles />
          </Route>
          <Route exact path="/articles/:id">
            <Article />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}
