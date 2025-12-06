import {
  ChevronLeft,
  ChevronRight,
  User,
  ChevronDown,
  Music,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useSpotifyData } from "@/hooks/useSpotifyData";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";

export function Header() {
  const { user, profile, logout } = useAuth();
  const { syncSpotifyData, getAIRecommendations, loading } = useSpotifyData();
  const { isAuthenticated: spotifyAuthed, login: loginSpotify } =
    useSpotifyAuth();
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full bg-background/10 text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full bg-background/10 text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {!spotifyAuthed && (
          <Button
            variant="outline"
            className="border-foreground/20 bg-background/10 text-foreground hover:bg-background/20"
            onClick={loginSpotify}
          >
            <Music className="mr-2 h-4 w-4" />
            Connect Spotify
          </Button>
        )}
        {user && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncSpotifyData(user.id)}
              disabled={loading}
            >
              Sync Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => getAIRecommendations(user.id)}
              disabled={loading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Get AI Recommendations
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-1 rounded-full bg-background/90 px-2 text-foreground hover:bg-background"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <span className="text-sm">
                {profile?.display_name || "Guest"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Account</DropdownMenuItem>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
