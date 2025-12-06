import { Search, User, LogOut, Settings } from "lucide-react"; // Import Settings Icon
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, login, logout } = useSpotifyAuth();
  const navigate = useNavigate(); // Add hook

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9 border border-white/10">
                      <AvatarImage
                        src={user.images?.[0]?.url}
                        alt={user.display_name}
                      />
                      <AvatarFallback>
                        {user.display_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.display_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-500 focus:text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={login}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-black font-semibold"
              >
                Login with Spotify
              </Button>
            )}
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
