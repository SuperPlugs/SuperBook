import { useState } from "react";
import { EnhancedSkeleton, SkeletonParagraph, SkeletonButton } from "./ui/enhanced-skeleton";
import LoadingIndicator from "./ui/loading-indicator";

export const LoadingStatesDemo = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demos = [
    {
      id: "skeleton-shimmer",
      title: "Shimmer Effect",
      description: "Smooth shimmer animation for content loading"
    },
    {
      id: "skeleton-wave",
      title: "Wave Effect", 
      description: "Gentle wave animation for progressive loading"
    },
    {
      id: "skeleton-pulse",
      title: "Pulse Effect",
      description: "Classic pulse animation for simple loading states"
    },
    {
      id: "loading-indicators",
      title: "Loading Indicators",
      description: "Various spinner and indicator styles"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <div className="bg-card rounded-lg p-8 shadow-card border">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Loading States Demo
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Explore different loading animations and skeleton patterns used throughout the application
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(activeDemo === demo.id ? null : demo.id)}
              className={`p-4 border rounded-lg text-left transition-all ${
                activeDemo === demo.id
                  ? "border-highlight bg-highlight/5"
                  : "border-border hover:border-highlight/50"
              }`}
            >
              <h3 className="font-semibold mb-2">{demo.title}</h3>
              <p className="text-sm text-muted-foreground">{demo.description}</p>
            </button>
          ))}
        </div>

        {activeDemo === "skeleton-shimmer" && (
          <div className="bg-muted rounded-lg p-6 animate-fade-in">
            <h3 className="font-semibold mb-4">Shimmer Skeleton Components</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Profile Card</h4>
                <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                  <EnhancedSkeleton variant="shimmer" className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <EnhancedSkeleton variant="shimmer" className="h-4 w-24" />
                    <EnhancedSkeleton variant="shimmer" className="h-3 w-32" />
                    <EnhancedSkeleton variant="shimmer" className="h-3 w-20" />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Article Content</h4>
                <div className="p-4 bg-background rounded-lg space-y-3">
                  <EnhancedSkeleton variant="shimmer" className="h-6 w-3/4" />
                  <SkeletonParagraph lines={4} />
                  <div className="flex gap-2">
                    <SkeletonButton />
                    <SkeletonButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDemo === "skeleton-wave" && (
          <div className="bg-muted rounded-lg p-6 animate-fade-in">
            <h3 className="font-semibold mb-4">Wave Animation Skeletons</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Data Table</h4>
                <div className="p-4 bg-background rounded-lg">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[...Array(4)].map((_, i) => (
                      <EnhancedSkeleton key={i} variant="wave" className="h-4 w-full" />
                    ))}
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 mb-2">
                      {[...Array(4)].map((_, j) => (
                        <EnhancedSkeleton key={j} variant="wave" className="h-3 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Dashboard Cards</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 bg-background rounded-lg space-y-3">
                      <EnhancedSkeleton variant="wave" className="h-4 w-16" />
                      <EnhancedSkeleton variant="wave" className="h-8 w-20" />
                      <EnhancedSkeleton variant="wave" className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDemo === "skeleton-pulse" && (
          <div className="bg-muted rounded-lg p-6 animate-fade-in">
            <h3 className="font-semibold mb-4">Pulse Animation Skeletons</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Media List</h4>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-background rounded-lg">
                      <EnhancedSkeleton variant="pulse" className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <EnhancedSkeleton variant="pulse" className="h-4 w-32" />
                        <EnhancedSkeleton variant="pulse" className="h-3 w-48" />
                        <EnhancedSkeleton variant="pulse" className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Form Fields</h4>
                <div className="p-4 bg-background rounded-lg space-y-4">
                  <div>
                    <EnhancedSkeleton variant="pulse" className="h-3 w-16 mb-2" />
                    <EnhancedSkeleton variant="pulse" className="h-10 w-full" />
                  </div>
                  <div>
                    <EnhancedSkeleton variant="pulse" className="h-3 w-20 mb-2" />
                    <EnhancedSkeleton variant="pulse" className="h-24 w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeDemo === "loading-indicators" && (
          <div className="bg-muted rounded-lg p-6 animate-fade-in">
            <h3 className="font-semibold mb-4">Loading Indicators</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Spinners</h4>
                <div className="flex items-center gap-8 p-4 bg-background rounded-lg">
                  <div className="text-center">
                    <LoadingIndicator variant="spinner" size="sm" />
                    <p className="text-xs mt-2 text-muted-foreground">Small</p>
                  </div>
                  <div className="text-center">
                    <LoadingIndicator variant="spinner" size="md" />
                    <p className="text-xs mt-2 text-muted-foreground">Medium</p>
                  </div>
                  <div className="text-center">
                    <LoadingIndicator variant="spinner" size="lg" />
                    <p className="text-xs mt-2 text-muted-foreground">Large</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Dots</h4>
                <div className="flex items-center gap-8 p-4 bg-background rounded-lg">
                  <div className="text-center">
                    <LoadingIndicator variant="dots" size="sm" />
                    <p className="text-xs mt-2 text-muted-foreground">Small</p>
                  </div>
                  <div className="text-center">
                    <LoadingIndicator variant="dots" size="md" />
                    <p className="text-xs mt-2 text-muted-foreground">Medium</p>
                  </div>
                  <div className="text-center">
                    <LoadingIndicator variant="dots" size="lg" />
                    <p className="text-xs mt-2 text-muted-foreground">Large</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">With Text</h4>
                <div className="space-y-3 p-4 bg-background rounded-lg">
                  <LoadingIndicator variant="spinner" text="Loading content..." />
                  <LoadingIndicator variant="dots" text="Processing data..." />
                  <LoadingIndicator variant="pulse" text="Saving changes..." />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};