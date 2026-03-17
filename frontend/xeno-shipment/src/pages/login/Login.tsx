"use client";

import { useState } from "react";
import React from "react";
import { Button, Input, Form } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { preloadParcelItemsCache } from "@hooks/useParcelItemsCache";

export default function Component() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Allow demo user to bypass domain restriction
    if (email !== "admin" && !email.endsWith("@xenoptics.com")) {
      setError("Only @xenoptics.com emails are allowed.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(import.meta.env.VITE_APP_EMAIL_LOGIN_API_URL, {
        email,
        password,
      });

      console.log('Email login response:', response.data);

      // Create user object and update auth context - handle the API response data
      const responseData = response.data;

      // Create combined user data for auth context
      const userData = {
        email: responseData.email,
        name: responseData.name,
        id: responseData.id,
        accessToken: responseData.access_token
      };

      login(userData);

      // navigate("/overview")
      navigate("/shipment")

      // Preload parcel items cache in the background
      preloadParcelItemsCache();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Login failed. Email or Password Not Correct.");
    } finally {
      setLoading(false);
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4">
      <div className="p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full bg-white rounded-lg shadow-lg p-6 lg:p-8 flex flex-col items-center justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          {/* Demo credentials notice */}
          <div className="w-full mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Demo Access</p>
            <p>Email / Username: <span className="font-mono font-bold">admin</span></p>
            <p>Password: <span className="font-mono font-bold">12345</span></p>
          </div>

          <Form className="flex flex-col gap-3" validationBehavior="native" onSubmit={handleSubmit}>
            <Input
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              label="Email or Username"
              name="email"
              placeholder="Enter your email or username"
              type="text"
              variant="bordered"
            />
            <Input
              onChange={(e) => setPassword(e.target.value)}
              isRequired
              endContent={
                <button type="button" onClick={toggleVisibility}>
                  {isVisible ? (
                    <Icon
                      className="text-default-400 pointer-events-none text-2xl"
                      icon="solar:eye-closed-linear"
                    />
                  ) : (
                    <Icon
                      className="text-default-400 pointer-events-none text-2xl"
                      icon="solar:eye-bold"
                    />
                  )}
                </button>
              }
              label="Password"
              name="password"
              placeholder="Enter your password"
              type={isVisible ? "text" : "password"}
              variant="bordered"
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button className="w-full" color="primary" type="submit">
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
