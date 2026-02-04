import { motion } from "framer-motion";
import { Phone, Mail, Building2 } from "lucide-react";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-l from-gold-dark via-gold to-gold-dark opacity-95" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="relative container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8" dir="rtl">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-xl"
            >
              <Building2 className="w-10 h-10 text-white" />
            </motion.div>
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                MALI TENENBAUM
              </h1>
              <p className="text-white/80 text-lg mt-1">
                Architecture & Design
              </p>
              <p className="text-white/60 text-sm mt-2">
                אדריכלות, עיצוב פנים וליווי פרויקטים
              </p>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <motion.a
              href="tel:054-666-7803"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <span className="font-medium">054-666-7803</span>
              <Phone className="w-4 h-4" />
            </motion.a>
            <motion.a
              href="mailto:mali.f.arch@gmail.com"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <span className="font-medium text-sm">mali.f.arch@gmail.com</span>
              <Mail className="w-4 h-4" />
            </motion.a>
          </div>
        </div>
      </div>
      
      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 40V20C200 0 400 0 600 20C800 40 1000 40 1200 20V40H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </motion.header>
  );
};

export default Header;
