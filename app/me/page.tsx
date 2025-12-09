"use client";

// pages/me.tsx
import { NextPage } from "next";
import { useUser } from "../../hooks/useUser";

const MePage: NextPage = () => {
  const { user, isLoading, isError } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading user data.</div>;

  return (
    <div>
      <h1>My Profile</h1>
      <div>
        <p>
          <strong>Username:</strong> {user.username}
        </p>
        {user.email && (
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        )}
        {/* Display additional user fields as needed */}
      </div>
    </div>
  );
};

export default MePage;
