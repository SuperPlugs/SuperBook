import { cn } from "../../lib/utils";

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  text?: string;
}

export const LoadingIndicator = ({ 
  size = "md", 
  variant = "spinner", 
  className,
  text 
}: LoadingIndicatorProps) => {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "lg":
        return "w-6 h-6";
      case "md":
      default:
        return "w-4 h-4";
    }
  };

  const getSpinner = () => (
    <div 
      className={cn(
        "border-2 border-highlight border-t-transparent rounded-full animate-spin",
        getSizeClass(),
        className
      )} 
    />
  );

  const getDots = () => (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-highlight rounded-full animate-pulse",
            getSizeClass()
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s"
          }}
        />
      ))}
    </div>
  );

  const getPulse = () => (
    <div 
      className={cn(
        "bg-highlight rounded-full animate-pulse",
        getSizeClass(),
        className
      )} 
    />
  );

  const getIndicator = () => {
    switch (variant) {
      case "dots":
        return getDots();
      case "pulse":
        return getPulse();
      case "spinner":
      default:
        return getSpinner();
    }
  };

  if (text) {
    return (
      <div className="flex items-center gap-2">
        {getIndicator()}
        <span className="text-sm text-muted-foreground">{text}</span>
      </div>
    );
  }

  return getIndicator();
};

export default LoadingIndicator;