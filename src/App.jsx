import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Callback from "./pages/Callback";
import Playlist from "./pages/Playlist";
import LikedSongs from "./pages/LikedSongs";
import { AuthProvider as SpotifyAuthProvider } from "@/context/SpotifyAuthContext";
import { PlayerProvider } from "@/context/PlayerContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SpotifyAuthProvider>
      <PlayerProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/playlist/:playlistId" element={<Playlist />} />
              <Route path="/liked-songs" element={<LikedSongs />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PlayerProvider>
    </SpotifyAuthProvider>
  </QueryClientProvider>
);

export default App;
