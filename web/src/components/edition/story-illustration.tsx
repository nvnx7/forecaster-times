import Image from "next/image";
import type { Illustration } from "@/types";

export function StoryIllustration({
  illustration,
}: {
  illustration: Illustration;
}) {
  return (
    <figure className="flex flex-col gap-1">
      <Image
        className="w-full border border-foreground object-cover"
        src={illustration.src}
        alt={illustration.alt}
        width={1440}
        height={480}
        style={{
          aspectRatio: illustration.aspectRatio?.replace(":", " / ") ?? "3 / 2",
        }}
      />
      {illustration.caption ? (
        <figcaption className="font-sans text-sm italic text-muted-foreground">
          {illustration.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
