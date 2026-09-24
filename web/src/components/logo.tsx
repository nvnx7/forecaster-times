import { cn } from "cn";
import Image from "next/image";

import logo from "../../public/logo.png";

const logoAspectRatio = 2172 / 724;

type LogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = 64, className, priority = false }: LogoProps) {
  return (
    <Image
      src={logo}
      alt="Forecaster Times emblem"
      sizes={`${Math.round(size * logoAspectRatio)}px`}
      priority={priority}
      quality={100}
      className={cn("w-auto object-contain", className)}
      style={{ height: size }}
    />
  );
}
