import { cn } from "@infrastructure/ui";
import { Text, type TextProps, View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn("rounded-lg border border-border bg-card shadow-sm", className)}
      {...props}
    />
  );
}

export interface CardHeaderProps extends ViewProps {
  className?: string;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <View className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

export interface CardTitleProps extends TextProps {
  className?: string;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <Text
      className={cn(
        "text-xl font-semibold leading-none tracking-tight text-card-foreground",
        className
      )}
      {...props}
    />
  );
}

export interface CardDescriptionProps extends TextProps {
  className?: string;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <Text className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export interface CardContentProps extends ViewProps {
  className?: string;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <View className={cn("p-4 pt-0", className)} {...props} />;
}

export interface CardFooterProps extends ViewProps {
  className?: string;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <View className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}
