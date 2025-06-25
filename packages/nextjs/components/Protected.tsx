"use client"
import React, { useState } from 'react';

export default function Protected({ children }: { children: React.ReactNode }) {
  const [pass, setPass] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASS; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === correctPassword) {
      setUnlocked(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: "1rem" }}>
      <input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="Enter password"
        style={{ padding: "0.5rem", fontSize: "1rem" }}
      />
      <button type="submit" style={{ marginLeft: "0.5rem" }}>
        Unlock
      </button>
    </form>
  );
}
