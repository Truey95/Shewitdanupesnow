import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, DollarSign, ExternalLink, Play } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface EventLink {
  title: string;
  url: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  images: string[];
  videos: string[];
  links: EventLink[];
  isActive: boolean;
  featured: boolean;
  capacity?: number;
  price?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ToursAndEvents() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative overflow-hidden rounded-lg bg-gray-900">
                <div className="h-48 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Failed to load events</p>
      </div>
    );
  }

  const featuredEvents = events?.filter(event => event.featured) || [];
  const regularEvents = events?.filter(event => !event.featured) || [];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-pink-900/50 to-blue-900/40">
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-40 right-1/3 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Tours & Events
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover exclusive experiences and unforgettable moments
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Events */}
        {featuredEvents.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif text-white mb-4">✨ Featured Events</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredEvents.map((event, index) => (
                <Card
                  key={event.id}
                  className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
                  onClick={() => setSelectedEvent(event)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-64 overflow-hidden">
                    {event.images && event.images.length > 0 && event.images[0] ? (
                      <img
                        src={`${event.images[0]}?t=${Date.now()}`}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.warn(`Failed to load image: ${event.images[0]}`);
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-image');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                      />
                    ) : null}
                    <div className={`fallback-image w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center ${event.images && event.images.length > 0 && event.images[0] ? 'hidden' : ''}`}>
                      <Calendar className="h-16 w-16 text-white/60" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold shadow-lg">
                      ⭐ Featured
                    </Badge>
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                        Premium Event
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl text-white group-hover:text-purple-300 transition-colors">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 line-clamp-2">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-gray-300">
                      <div className="flex items-center space-x-3 group-hover:text-purple-300 transition-colors">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">{format(new Date(event.startDate), "PPP")}</span>
                      </div>
                      <div className="flex items-center space-x-3 group-hover:text-purple-300 transition-colors">
                        <MapPin className="h-4 w-4 text-pink-400" />
                        <span>{event.location}</span>
                      </div>
                      {event.price && (
                        <div className="flex items-center space-x-3 group-hover:text-purple-300 transition-colors">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="font-semibold text-green-400">${event.price}</span>
                        </div>
                      )}
                      {event.capacity && (
                        <div className="flex items-center space-x-3 group-hover:text-purple-300 transition-colors">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span>Limited to {event.capacity} guests</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Events */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-white mb-4">🎉 Upcoming Events</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularEvents.map((event, index) => (
              <Card
                key={event.id}
                className="group bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-500/50"
                onClick={() => setSelectedEvent(event)}
                style={{ animationDelay: `${(index + featuredEvents.length) * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  {event.images[0] ? (
                    <img
                      src={`${event.images[0]}?t=${Date.now()}`}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn(`Failed to load image: ${event.images[0]}`);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.fallback-image')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`fallback-image w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center ${event.images[0] ? 'hidden' : ''}`}>
                    <Calendar className="h-12 w-12 text-white/60" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent group-hover:from-black/60 transition-all duration-300" />
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <div className="flex items-center space-x-2 group-hover:text-blue-300 transition-colors">
                      <Calendar className="h-3 w-3 text-blue-400" />
                      <span className="font-medium">{format(new Date(event.startDate), "PP")}</span>
                    </div>
                    <div className="flex items-center space-x-2 group-hover:text-blue-300 transition-colors">
                      <MapPin className="h-3 w-3 text-pink-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.price && (
                      <div className="flex items-center space-x-2 group-hover:text-blue-300 transition-colors">
                        <DollarSign className="h-3 w-3 text-green-400" />
                        <span className="font-semibold text-green-400">${event.price}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {(!events || events.length === 0) && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-4">No Events Yet</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                We're planning some amazing experiences for you. 
                <br />
                Check back soon for exclusive events and tours!
              </p>
              <div className="mt-8">
                <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Event Image */}
                {selectedEvent.images.length > 0 && (
                  <div>
                    <div className="w-full">
                      <img
                        src={`${selectedEvent.images[0]}?t=${Date.now()}`}
                        alt={selectedEvent.title}
                        className="w-full h-auto object-contain rounded-lg cursor-pointer hover:opacity-90"
                        crossOrigin="anonymous"
                        onClick={() => setSelectedImage(selectedEvent.images[0])}
                        onError={(e) => {
                          console.warn(`Failed to load modal image: ${selectedEvent.images[0]}`);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.querySelector('.modal-fallback')?.classList.remove('hidden');
                        }}
                      />
                      <div className="modal-fallback hidden w-full h-64 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="space-y-4">
                  <p className="text-gray-300">{selectedEvent.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(selectedEvent.startDate), "PPP")}
                          {selectedEvent.endDate && ` - ${format(new Date(selectedEvent.endDate), "PPP")}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedEvent.capacity && (
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {selectedEvent.capacity}</span>
                        </div>
                      )}
                      {selectedEvent.price && (
                        <div className="flex items-center space-x-2 text-gray-300">
                          <DollarSign className="h-4 w-4" />
                          <span>Price: ${selectedEvent.price}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Videos */}
                {selectedEvent.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Videos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEvent.videos.map((video, index) => (
                        <div
                          key={index}
                          className="relative h-48 bg-gray-800 rounded-lg cursor-pointer hover:opacity-90 flex items-center justify-center"
                          onClick={() => setSelectedVideo(video)}
                        >
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {selectedEvent.links.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Related Links</h3>
                    <div className="space-y-2">
                      {selectedEvent.links.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>{link.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl bg-black border-gray-800">
          {selectedImage && (
            <div className="relative">
              <img
                src={`${selectedImage}?t=${Date.now()}`}
                alt="Event"
                className="w-full h-auto"
                crossOrigin="anonymous"
                onError={(e) => {
                  console.warn(`Failed to load fullscreen image: ${selectedImage}`);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fullscreen-fallback')?.classList.remove('hidden');
                }}
              />
              <div className="fullscreen-fallback hidden w-full h-64 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Calendar className="h-16 w-16 mx-auto mb-4" />
                  <p>Image not available</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl bg-black border-gray-800">
          {selectedVideo && (
            <video
              src={selectedVideo}
              controls
              className="w-full h-auto"
              autoPlay
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}