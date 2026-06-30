// Users.jsx

import { useEffect, useState } from "react";
import { getAllUsers, getProfile } from "../api/users";

function Users() {
  console.log("Users component rendered");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
        try {
            console.log("Before API call");
            const resp = await getAllUsers();
            console.log("Response:", resp);
            setUsers(resp.data);
            console.log("All users:", resp.data);
        } catch (err) {
            setError("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }
    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Users</h1>
    </div>
  );
}

export default Users;