import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.map((p) => p[0]).join("");
  return initials.slice(0, 2).toUpperCase() || "?";
}

export function UserAvatar({ name, image, size = "default", className }: Props) {
  return (
    <Avatar size={size} className={cn(className)}>
      {image ? <AvatarImage src={image} alt={name ?? "User avatar"} /> : null}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
