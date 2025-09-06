import { useState }from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Lock, Facebook, Github } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-pink-700 p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 border border-transparent hover:border-red-400 hover:shadow-red-400/70 hover:scale-[1.02]">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight hover:text-red-700 transition-colors duration-200">
                BloodConnect Login
              </h1>
              <p className="text-gray-500 mt-2 hover:text-gray-700 transition-colors duration-200">
                Sign in to continue to your account
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                variant={mode === "email" ? "default" : "outline"}
                onClick={() => setMode("email")}
                className="hover:scale-105 transition-transform duration-200 hover:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50"
              >
                <Mail className="w-4 h-4 mr-1" /> Email
              </Button>
              <Button
                variant={mode === "phone" ? "default" : "outline"}
                onClick={() => setMode("phone")}
                className="hover:scale-105 transition-transform duration-200 hover:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50"
              >
                <Phone className="w-4 h-4 mr-1" /> Phone
              </Button>
            </div>

            <form className="space-y-4">
              {mode === "email" && (
                <Input type="email" placeholder="Email Address" required className="hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50 transition-all duration-200" />
              )}
              {mode === "phone" && (
                <Input type="tel" placeholder="Phone Number" required className="hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50 transition-all duration-200" />
              )}
              <Input type="password" placeholder="Password" required className="hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50 transition-all duration-200" />

              <Button className="w-full hover:scale-105 hover:shadow-lg hover:shadow-red-500/40 hover:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50 transition-all duration-300" size="lg">
                <Lock className="w-4 h-4 mr-2" /> Login
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex items-center justify-center hover:bg-gray-100 hover:scale-105 hover:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50 transition-all duration-200">
                <Github className="w-5 h-5 mr-2" /> Google
              </Button>
              <Button variant="outline" className="flex items-center justify-center hover:bg-gray-100 hover:scale-105 hover:border-red-500 focus:ring-2 focus:ring-red-400 focus:shadow-red-400/50 transition-all duration-200">
                <Facebook className="w-5 h-5 mr-2" /> Facebook
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              Don’t have an account?{" "}
              <a
                href="/register"
                className="text-red-600 font-medium hover:underline hover:text-red-700 transition-colors duration-200"
              >
                Sign up
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
