import { cn } from "../../lib/utils";

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "shimmer" | "pulse" | "wave";
  lines?: number;
  width?: string | number;
  height?: string | number;
}

function EnhancedSkeleton({
  className,
  variant = "shimmer",
  lines = 1,
  width,
  height,
  ...props
}: EnhancedSkeletonProps) {
  const getVariantClass = () => {
    switch (variant) {
      case "shimmer":
        return "relative overflow-hidden bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";
      case "wave":
        return "animate-[wave_1.5s_ease-in-out_infinite] bg-muted";
      case "pulse":
      default:
        return "animate-pulse bg-muted";
    }
  };

  const skeletonStyle = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "rounded-md h-4",
              getVariantClass(),
              index === lines - 1 && "w-3/4" // Last line is shorter
            )}
            style={{
              ...skeletonStyle,
              width: 
                index === lines - 1 
                  ? typeof width === "string" 
                    ? `calc(${width} * 0.75)` 
                    : width 
                      ? `${Number(width) * 0.75}px` 
                      : "75%"
                  : skeletonStyle.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-md", getVariantClass(), className)}
      style={skeletonStyle}
      {...props}
    />
  );
}

// Predefined skeleton patterns for common use cases
const SkeletonWord = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <EnhancedSkeleton
    variant="shimmer"
    className={cn("h-4 w-16", className)}
    {...props}
  />
);

const SkeletonLine = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <EnhancedSkeleton
    variant="shimmer"
    className={cn("h-4 w-full", className)}
    {...props}
  />
);

const SkeletonParagraph = ({ lines = 3, className, ...props }: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <EnhancedSkeleton
    variant="shimmer"
    lines={lines}
    className={cn("w-full", className)}
    {...props}
  />
);

const SkeletonButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <EnhancedSkeleton
    variant="pulse"
    className={cn("h-10 w-20 rounded-md", className)}
    {...props}
  />
);

export { 
  EnhancedSkeleton, 
  SkeletonWord, 
  SkeletonLine, 
  SkeletonParagraph, 
  SkeletonButton 
};