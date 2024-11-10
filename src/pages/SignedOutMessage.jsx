import React from "react";
import { useNavigate } from "react-router-dom";

const SignedOutMessage = () => {
  const navigate = useNavigate();

  const handleJoinAsGuest = () => {
    navigate("/translator");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-6 bg-white shadow-md rounded-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold text-gray-800">
          You are not signed in
        </h2>
        <p className="text-gray-600 mt-2">
          Please visit the QuickLator web app and sign in to get full access.
        </p>
        <button
          onClick={handleJoinAsGuest}
          className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Join as Guest
        </button>
      </div>
    </div>
  );
};

export default SignedOutMessage;
