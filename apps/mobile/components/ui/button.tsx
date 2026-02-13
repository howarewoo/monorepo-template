import { cn } from "@repo/ui";
import { type VariantProps, cva } from "class-variance-authority";
import { Pressable, type PressableProps } from "react-native";

const buttonVariants = cva("flex items-center justify-center rounded-md", {
  variants: {
    variant: {
      default: "bg-primary",
      destructive: "bg-destructive",
      outline: "border border-input bg-background",
      secondary: "bg-secondary",
      ghost: "",
      link: "",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <Pressable className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
