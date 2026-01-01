import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TryItOn() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
        setProcessedImage(null); // Reset processed image when new photo is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleItemSelect = async (itemPath: string) => {
    // Convert the image path to base64
    try {
      const response = await fetch(itemPath);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedItem(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading item image:', error);
    }
  };

  const handleTryOn = async () => {
    if (!userPhoto || !selectedItem) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPhoto,
          selectedItem,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process images');
      }

      const data = await response.json();
      setProcessedImage(data.url);
    } catch (error) {
      console.error('Error processing try-on:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 tracking-tight">Virtual Try-On</h1>
        <p className="text-lg mb-8 tracking-wide font-light">
          Experience our collection virtually before you buy. Upload your photo and select an item to see how it looks on you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="bg-gray-100 rounded-lg p-6 aspect-square flex flex-col items-center justify-center relative">
            {processedImage ? (
              <img
                src={processedImage}
                alt="AI Generated Try-On"
                className="w-full h-full object-contain"
              />
            ) : userPhoto ? (
              <img
                src={userPhoto}
                alt="Your Photo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-500">
                <p className="mb-4">Upload your photo to try on items</p>
                <Button 
                  onClick={handleUploadClick}
                  className="bg-[#590000] hover:bg-[#3D0000] text-white"
                >
                  Upload Photo
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4 tracking-wide">Available Items</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "He Wit Da K's Now Tee",
                  image: "/images/products/4.png"
                },
                {
                  name: "She Wit Da Nupes Now",
                  image: "/images/products/5.png"
                },
                {
                  name: "She Wit Da Nupes Now Premium",
                  image: "/images/products/6.png"
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${
                    selectedItem === item.image
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                  onClick={() => handleItemSelect(item.image)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full aspect-square object-contain mb-2"
                  />
                  <p className="text-sm font-medium text-center">{item.name}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button 
                size="lg" 
                className="w-full bg-[#590000] hover:bg-[#3D0000] text-white tracking-wider uppercase"
                disabled={!selectedItem || !userPhoto || isProcessing}
                onClick={handleTryOn}
              >
                {isProcessing ? "Processing..." : "Try It On"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}