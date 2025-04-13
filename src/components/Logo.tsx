import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image 
        src="/Vitraya_logo.png" 
        alt="Vitraya Logo" 
        width={size} 
        height={size} 
        className="object-contain"
        priority
      />
    </div>
  );
} 