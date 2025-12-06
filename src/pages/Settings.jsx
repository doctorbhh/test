import React, { useEffect, useState } from "react";
import {
  Server,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  Loader2,
  Music,
  Signal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  fetchInstances,
  getSavedInstance,
  setSavedInstance,
  clearAllData,
  DEFAULT_INSTANCE,
  getAudioQuality,
  setAudioQuality,
} from "@/services/instanceService";

const Settings = () => {
  const [instances, setInstances] = useState([]);
  const [currentInstance, setCurrentInstance] = useState(DEFAULT_INSTANCE);
  const [currentQuality, setCurrentQuality] = useState("high");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInstances();
    setCurrentInstance(getSavedInstance());
    setCurrentQuality(getAudioQuality());
  }, []);

  const loadInstances = async () => {
    setLoading(true);
    try {
      const list = await fetchInstances();
      if (list.length > 0) {
        setInstances(list);
        toast.success(`Loaded ${list.length} instances`);
      } else {
        toast.error("Could not load instances list");
      }
    } catch (e) {
      toast.error("Failed to fetch instances");
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceChange = (value) => {
    setSavedInstance(value);
    setCurrentInstance(value);
    toast.success("Search API updated");
  };

  const handleQualityChange = (value) => {
    setAudioQuality(value);
    setCurrentQuality(value);
    toast.success(`Audio quality set to ${value}`);
  };

  const handleClearData = () => {
    clearAllData();
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl pb-24">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* API Instance Settings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle>Search API Instance</CardTitle>
            </div>
            <CardDescription>
              Select the server used for searching songs. Uses Piped API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={currentInstance}
                onValueChange={handleInstanceChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_INSTANCE}>
                    Default ({new URL(DEFAULT_INSTANCE).hostname})
                  </SelectItem>
                  {instances.map((inst, idx) => (
                    <SelectItem key={idx} value={inst.api_url}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={loadInstances}
                disabled={loading}
                title="Refresh List"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              Current:{" "}
              <span className="font-mono bg-muted px-1 rounded">
                {currentInstance}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Audio Quality Settings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Signal className="h-5 w-5 text-primary" />
              <CardTitle>Audio Quality</CardTitle>
            </div>
            <CardDescription>
              Adjust streaming quality. Higher quality uses more data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={currentQuality} onValueChange={handleQualityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (Best Audio)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="low">Low (Data Saver)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions regarding your local data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data & Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all local settings, cached data, and logout
                    your session. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
