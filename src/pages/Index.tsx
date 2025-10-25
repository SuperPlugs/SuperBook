import { DictionaryDemo } from "../components/DictionaryDemo";
import { LoadingStatesDemo } from "../components/LoadingStatesDemo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            📚 SuperBook Extension
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A Chrome extension that provides instant word definitions when you select text on any webpage.
            Try the demo below to see how it works!
          </p>
        </div>
        
        <DictionaryDemo />
        <LoadingStatesDemo />
      </div>
    </div>
  );
};

export default Index;
