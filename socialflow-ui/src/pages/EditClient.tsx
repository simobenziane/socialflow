import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClient, useUpdateClient, useAccounts } from '@/hooks';
import { PageHeader, LoadingSpinner, ErrorAlert } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Video, Image, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditClient() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const client = useClient(slug || '');
  const updateClient = useUpdateClient();
  const accounts = useAccounts();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('restaurant');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Paris');
  // Late.com profile selection (v16.4)
  const [lateProfileId, setLateProfileId] = useState('');
  // Schedule times (v17.8) - Format-specific posting times
  const [photoTime, setPhotoTime] = useState('19:00');
  const [videoTime, setVideoTime] = useState('20:00');
  const [storyTime, setStoryTime] = useState('12:00');
  const [isInitialized, setIsInitialized] = useState(false);

  // Brand configuration state
  const [brandVoice, setBrandVoice] = useState('');
  const [brandTargetAudience, setBrandTargetAudience] = useState('');
  const [hashtagsText, setHashtagsText] = useState('');

  // AI Caption settings (v16.1, v17.6)
  const [videoAiCaptions, setVideoAiCaptions] = useState(false);
  const [photoAiCaptions, setPhotoAiCaptions] = useState(true);

  // Initialize form with client data
  useEffect(() => {
    if (client.data?.data && !isInitialized) {
      const clientData = client.data.data;
      setName(clientData.name);
      setType(clientData.type);
      setLanguage(clientData.language);
      setTimezone(clientData.timezone);
      // v16.4: Initialize with profile ID if available
      setLateProfileId(clientData.late_profile_id || '');
      // v17.8: Format-specific schedule times
      setPhotoTime(clientData.schedule?.photo_time || clientData.schedule?.feed_time || '19:00');
      setVideoTime(clientData.schedule?.video_time || clientData.schedule?.feed_time || '20:00');
      setStoryTime(clientData.schedule?.story_time || '12:00');
      // Brand fields
      setBrandVoice(clientData.brand_voice || '');
      setBrandTargetAudience(clientData.brand_target_audience || '');
      setHashtagsText(
        clientData.hashtags
          ? clientData.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')
          : ''
      );
      // AI Caption settings (v16.1, v17.6)
      setVideoAiCaptions(clientData.video_ai_captions ?? false);
      setPhotoAiCaptions(clientData.photo_ai_captions ?? true);
      setIsInitialized(true);
    }
  }, [client.data, isInitialized]);

  // N11: State for profile unlink confirmation
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updateClient.isPending || !slug) return;

    if (!name) {
      toast({
        title: 'Validation error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    // N9: Warn if selected profile has no healthy accounts
    if (lateProfileId && lateProfileId !== 'none') {
      const profileHealth = profileHealthMap.get(lateProfileId);
      if (profileHealth && !profileHealth.hasHealthy) {
        toast({
          title: 'Warning',
          description: 'The selected profile has no healthy accounts. You may need to re-authenticate.',
          variant: 'destructive',
        });
        // Still allow save but warn user
      }
    }

    // N11: Confirm before unlinking profile
    const isUnlinking = originalProfileId && (lateProfileId === 'none' || !lateProfileId);
    if (isUnlinking && !showUnlinkConfirm) {
      setShowUnlinkConfirm(true);
      toast({
        title: 'Confirm profile unlink',
        description: 'Click Save again to confirm unlinking the Late.com profile.',
      });
      return;
    }
    setShowUnlinkConfirm(false);

    // Parse hashtags from space-separated text
    const hashtagsArray = hashtagsText
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t.slice(1) : t);

    try {
      await updateClient.mutateAsync({
        slug,
        input: {
          name,
          slug, // Slug is immutable but we need to pass it
          type,
          language,
          timezone,
          late_profile_id: lateProfileId && lateProfileId !== 'none' ? lateProfileId : undefined,
          // v17.8: Format-specific schedule times
          photo_time: photoTime,
          video_time: videoTime,
          story_time: storyTime,
          feed_time: photoTime, // Legacy: keep for backwards compatibility
          brand_voice: brandVoice || undefined,
          brand_target_audience: brandTargetAudience || undefined,
          hashtags: hashtagsArray.length > 0 ? hashtagsArray : undefined,
          video_ai_captions: videoAiCaptions,
          photo_ai_captions: photoAiCaptions,
        },
      });

      toast({
        title: 'Client updated',
        description: `Successfully updated ${name}`,
      });

      navigate(`/clients/${slug}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update client',
        variant: 'destructive',
      });
    }
  };

  if (!slug) {
    return <ErrorAlert message="No client specified" />;
  }

  if (client.isLoading || accounts.isLoading) {
    return <LoadingSpinner text="Loading client..." />;
  }

  if (client.error) {
    return (
      <ErrorAlert
        message={client.error.message}
        onRetry={() => client.refetch()}
      />
    );
  }

  const clientData = client.data?.data;
  if (!clientData) {
    return <ErrorAlert message="Client not found" />;
  }

  // Get profiles and accounts for profile selection
  const profiles = accounts.data?.data?.profiles || [];
  const allAccounts = accounts.data?.data?.accounts || [];

  // Filter accounts by selected profile
  const selectedProfileAccounts = useMemo(() => {
    if (!lateProfileId || lateProfileId === 'none') return [];
    return allAccounts.filter(a => a.late_profile_id === lateProfileId);
  }, [lateProfileId, allAccounts]);

  // Check which profiles have all expired accounts (unusable)
  const profileHealthMap = useMemo(() => {
    const healthMap = new Map<string, { hasHealthy: boolean; allExpired: boolean; accountCount: number }>();
    for (const profile of profiles) {
      const profileAccounts = allAccounts.filter(a => a.late_profile_id === profile.id);
      const healthyAccounts = profileAccounts.filter(a => a.health === 'healthy' || a.health === 'warning');
      const expiredAccounts = profileAccounts.filter(a => a.health === 'expired');
      healthMap.set(profile.id, {
        hasHealthy: healthyAccounts.length > 0,
        allExpired: profileAccounts.length > 0 && expiredAccounts.length === profileAccounts.length,
        accountCount: profileAccounts.length,
      });
    }
    return healthMap;
  }, [profiles, allAccounts]);

  // Check if profile is changing from what was originally set
  const originalProfileId = clientData?.late_profile_id || '';
  const isProfileChanging = lateProfileId !== originalProfileId && originalProfileId !== '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Edit Client"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: clientData.name, to: `/clients/${slug}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Berlin Doner"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Slug cannot be changed after creation
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Configuration */}
        {clientData.ai_generated && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Brand Configuration
                </CardTitle>
                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30">
                  AI Generated
                </Badge>
              </div>
              <CardDescription>
                Edit the AI-generated brand voice and hashtags used for content creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandVoice">Brand Voice</Label>
                <Textarea
                  id="brandVoice"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  placeholder="Describe the brand's tone and personality..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  This is used as context when generating captions.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandTargetAudience">Target Audience</Label>
                <Input
                  id="brandTargetAudience"
                  value={brandTargetAudience}
                  onChange={(e) => setBrandTargetAudience(e.target.value)}
                  placeholder="e.g., Young professionals, families, foodies..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags</Label>
                <Input
                  id="hashtags"
                  value={hashtagsText}
                  onChange={(e) => setHashtagsText(e.target.value)}
                  placeholder="#food #restaurant #berlin..."
                />
                <p className="text-xs text-muted-foreground">
                  Space-separated hashtags to use in posts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Link Late.com Profile (v16.4) */}
        <Card>
          <CardHeader>
            <CardTitle>Link Late.com Profile</CardTitle>
            <CardDescription>
              Select a Late.com profile to link all its accounts to this client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile</Label>
              <Select value={lateProfileId} onValueChange={setLateProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {profiles.map((profile) => {
                    const health = profileHealthMap.get(profile.id);
                    const isExpired = health?.allExpired ?? false;
                    const hasNoAccounts = (health?.accountCount ?? 0) === 0;
                    return (
                      <SelectItem
                        key={profile.id}
                        value={profile.id}
                        disabled={isExpired}
                        className={isExpired ? 'opacity-50' : ''}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: profile.color }}
                          />
                          {profile.name}
                          {profile.description && (
                            <span className="text-muted-foreground">
                              - {profile.description}
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-red-500 text-xs ml-1">
                              (All accounts expired)
                            </span>
                          )}
                          {hasNoAccounts && (
                            <span className="text-yellow-500 text-xs ml-1">
                              (No accounts)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                All social accounts under this profile will be linked to this client.
              </p>
            </div>

            {/* Warning if changing profile */}
            {isProfileChanging && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <p className="text-sm font-medium text-yellow-600">
                  Changing the profile will relink all accounts
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The accounts from the new profile will replace any existing linked accounts.
                </p>
              </div>
            )}

            {/* Show accounts that will be linked */}
            {selectedProfileAccounts.length > 0 && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Accounts that will be linked:</p>
                {selectedProfileAccounts.map(acc => (
                  <div key={acc.id} className="flex items-center gap-2 text-sm">
                    <span>{acc.platform === 'instagram' ? '📷' : '🎵'}</span>
                    <span className="font-medium">@{acc.username}</span>
                    <span className="text-muted-foreground">({acc.platform})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show current linked accounts if no profile selected */}
            {(!lateProfileId || lateProfileId === 'none') && clientData.accounts && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Currently linked accounts:</p>
                {clientData.accounts.instagram && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>📷</span>
                    <span className="font-medium">@{clientData.accounts.instagram.username}</span>
                    <span className="text-muted-foreground">(instagram)</span>
                  </div>
                )}
                {clientData.accounts.tiktok && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🎵</span>
                    <span className="font-medium">@{clientData.accounts.tiktok.username}</span>
                    <span className="text-muted-foreground">(tiktok)</span>
                  </div>
                )}
                {!clientData.accounts.instagram && !clientData.accounts.tiktok && (
                  <p className="text-sm text-muted-foreground">No accounts linked</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Settings (v16.1) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              AI Caption Settings
            </CardTitle>
            <CardDescription>
              Configure how photos and videos are processed for caption generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="photoAiCaptions"
                checked={photoAiCaptions}
                onCheckedChange={(checked) => setPhotoAiCaptions(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="photoAiCaptions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Generate AI Captions for Photos
                </label>
                <p className="text-sm text-muted-foreground">
                  When enabled, AI will analyze photos and generate captions automatically.
                  When disabled, photos go directly to review for manual caption entry.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="videoAiCaptions"
                checked={videoAiCaptions}
                onCheckedChange={(checked) => setVideoAiCaptions(!!checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="videoAiCaptions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Generate AI Captions for Videos
                </label>
                <p className="text-sm text-muted-foreground">
                  When enabled, AI will analyze video frames and generate captions automatically.
                  When disabled, videos go directly to review for manual caption entry.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posting Schedule (v17.8) - Format-specific times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Posting Schedule
            </CardTitle>
            <CardDescription>
              Default times for each content format (24-hour)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="photoTime" className="flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5" />
                  Photo Posts
                </Label>
                <Input
                  id="photoTime"
                  type="time"
                  value={photoTime}
                  onChange={(e) => setPhotoTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoTime" className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  Video/Reels
                </Label>
                <Input
                  id="videoTime"
                  type="time"
                  value={videoTime}
                  onChange={(e) => setVideoTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storyTime" className="flex items-center gap-1.5">
                  <span className="text-xs">📱</span>
                  Stories
                </Label>
                <Input
                  id="storyTime"
                  type="time"
                  value={storyTime}
                  onChange={(e) => setStoryTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/clients/${slug}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateClient.isPending}>
            {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
