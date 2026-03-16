"use client";

import { useState } from "react";
import React from "react";
import { Button, Input, Form } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MicrosoftLogin from "./components/MicrosoftLogin";
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

    // Validate Microsoft email domain
    if (!email.endsWith("@xenoptics.com")) {
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
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="grid lg:grid-cols-2">

          {/* Left Panel - Branding */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-12 lg:p-16 flex flex-col justify-center items-center text-white relative overflow-hidden">

            {/* Brand Logo */}
            <div className="text-center mb-12 relative z-10">
              <img src="./images/xenoptics_original_logo_white.png" alt="Xen Logistic Logo" className="mx-auto mt-4 mb-4 w-72 h-auto" />
              {/* <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                XEN<span className="text-blue-400">OPTICS</span>
              </h1> */}
              <p className="text-xl text-gray-300 font-light">
                Logistics Shipments
              </p>
              <div className="w-24 h-1 bg-white mx-auto mt-4 rounded-full"></div>
            </div>
          </div>
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your account to continue</p>
              </div>

              <Form className="flex flex-col gap-3" validationBehavior="native" onSubmit={handleSubmit}>
                <Input
                  onChange={(e) => setEmail(e.target.value)}
                  isRequired
                  label="Xenoptics Email"
                  name="email"
                  placeholder="Enter your xenotpics email"
                  type="email"
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
              {/* Divider & Microsoft Login */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    or continue with
                  </span>
                </div>
              </div>
              <MicrosoftLogin />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
