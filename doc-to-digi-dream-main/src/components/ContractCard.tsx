import { motion } from "framer-motion";
import { FileText, Building2, Home, ChevronLeft } from "lucide-react";

interface ContractCardProps {
  title: string;
  subtitle: string;
  price: string;
  icon: "building" | "home" | "document";
  onClick: () => void;
  delay?: number;
}

const iconMap = {
  building: Building2,
  home: Home,
  document: FileText,
};

const ContractCard = ({ title, subtitle, price, icon, onClick, delay = 0 }: ContractCardProps) => {
  const Icon = iconMap[icon];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative bg-card rounded-2xl p-8 shadow-lg border border-border/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-gold/30">
        {/* Decorative corner */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-gold/20 to-transparent rounded-br-full" />
        
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative space-y-3 text-right" dir="rtl">
          <h3 className="text-xl font-bold text-foreground group-hover:text-gold-dark transition-colors duration-300">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Price */}
        <div className="relative mt-6 pt-6 border-t border-border/50" dir="rtl">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gold-dark">
              {price}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-gold transition-colors duration-300">
              <span>לפרטים נוספים</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </motion.div>
  );
};

export default ContractCard;
