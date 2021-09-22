import React from "react"
import useUsers from "../store/useUsers"

export default function Users() {
  const { users } = useUsers()
  return (
    <div className="users">
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
