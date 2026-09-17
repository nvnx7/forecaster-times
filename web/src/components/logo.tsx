import { cn } from "cn";
import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = 48, className, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Probability Press emblem"
      width={200}
      height={300}
      sizes={`${size}px`}
      priority={priority}
      className={cn("w-auto object-contain", className)}
      style={{ height: size }}
    />
  );
}
