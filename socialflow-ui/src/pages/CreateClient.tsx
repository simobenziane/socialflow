import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PageHeader, LoadingSpinner } from '@/components/shared';
import {
  useCreateClient,
  useAccounts,
  useGenerateClientConfig,
  useSyncAccounts,
  useCreateClientFolder,
} from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  User,
  Link2,
  Sparkles,
  Loader2,
  RefreshCw,
  FlaskConical,
  Image,
  Video,
  Clock,
} from 'lucide-react';
import type { OnboardingInput } from '@/api/types';

const STEPS = [
  { id: 1, name: 'Client Info', icon: User },
  { id: 2, name: 'Connect & Configure', icon: Link2 },
  { id: 3, name: 'Review', icon: Sparkles },
];

// Test data for French bakery/pastry school
const FRENCH_TEST_DATA = {
  name: 'La Pâtisserie École',
  type: 'other',
  language: 'fr',
  timezone: 'Europe/Paris',
  business_description: `Une boulangerie artisanale cosy + une école de pâtisserie/boulangerie. On apprend aux gens à réussir des pains et des pâtisseries délicieux grâce à des cours en petits groupes et des ateliers 100% pratiques. Focus : une technique rendue simple, des ingrédients de qualité, et une vibe fun "tu peux le faire". Les produits en boutique servent surtout à montrer ce que les élèves peuvent apprendre à réaliser.`,
  target_audience: `Débutants à intermédiaires (18–45 ans) qui aiment cuisiner. Foodies, couples, amis, touristes, et personnes en quête d'une activité créative le week-end. Intéressés par la pâtisserie, le levain, la décoration de gâteaux, et l'apprentissage de compétences utiles.`,
  brand_personality: `Chaleureuse, encourageante, légèrement joueuse. Experte sans jamais être intimidante. Phrases courtes, langage sensoriel, ton "coach sympa". Esprit artisan moderne (propre, premium mais accessible).`,
  content_themes: `• Moments de cours : mélanger, façonner, pousser, décorer
• Astuces rapides : erreurs fréquentes + comment les corriger
• Avant / après : progression des élèves
• Coulisses : four, outils, préparation, ingrédients
• Saisonnier : fournées de saison + ateliers à thème
• Mise en avant des élèves : réussites "première fois"`,
  call_to_actions: `Réserve un cours • DM pour prendre ta place • Sauvegarde cette astuce • Tag ton/ta pote de cuisine • Rejoins le prochain atelier • Regarde le planning • Passe nous voir ce week-end`,
  things_to_avoid: `Pas de prix/promos, pas de mentions de concurrents, pas de "meilleur de la ville", pas de promesses santé/médicales, pas de sujets controversés, pas d'inventions (récompenses/avis/certifs), pas de captions trop longues ni de jargon trop technique.`,
};

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CreateClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  // API hooks
  const createClient = useCreateClient();
  const accounts = useAccounts();
  const generateConfig = useGenerateClientConfig();
  const syncAccounts = useSyncAccounts();
  const createFolder = useCreateClientFolder();

  // Auto-sync on mount
  const hasSynced = useRef(false);
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncAccounts.mutate(undefined, {
        onSuccess: () => {
          if (isMountedRef.current) {
            toast({
              title: 'Accounts synced',
              description: 'Late.com profiles and accounts are up to date',
            });
          }
        },
        onError: (error) => {
          if (isMountedRef.current) {
            toast({
              title: 'Sync warning',
              description: error instanceof Error ? error.message : 'Could not sync accounts',
              variant: 'destructive',
            });
          }
        },
      });
    }
  }, [syncAccounts, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Client Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('restaurant');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [businessDescription, setBusinessDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandPersonality, setBrandPersonality] = useState('');

  // Advanced AI fields (collapsible)
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [contentThemes, setContentThemes] = useState('');
  const [callToActions, setCallToActions] = useState('');
  const [thingsToAvoid, setThingsToAvoid] = useState('');

  // Step 2: Profile & Settings
  const [lateProfileId, setLateProfileId] = useState('');
  const [videoAiCaptions, setVideoAiCaptions] = useState(false);
  const [photoAiCaptions, setPhotoAiCaptions] = useState(true); // Photos default to AI enabled
  // Schedule times (v17.8) - Format-specific posting times
  const [photoTime, setPhotoTime] = useState('19:00');
  const [videoTime, setVideoTime] = useState('20:00');
  const [storyTime, setStoryTime] = useState('12:00');

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleFillTestData = () => {
    setName(FRENCH_TEST_DATA.name);
    setSlug(slugify(FRENCH_TEST_DATA.name));
    setType(FRENCH_TEST_DATA.type);
    setLanguage(FRENCH_TEST_DATA.language);
    setTimezone(FRENCH_TEST_DATA.timezone);
    setBusinessDescription(FRENCH_TEST_DATA.business_description);
    setTargetAudience(FRENCH_TEST_DATA.target_audience);
    setBrandPersonality(FRENCH_TEST_DATA.brand_personality);
    setContentThemes(FRENCH_TEST_DATA.content_themes);
    setCallToActions(FRENCH_TEST_DATA.call_to_actions);
    setThingsToAvoid(FRENCH_TEST_DATA.things_to_avoid);
    setAdvancedOpen(true);
    toast({
      title: 'Test data loaded',
      description: 'French bakery/pastry school data has been filled in.',
    });
  };

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return name.trim() && slug.trim() && businessDescription.trim();
      case 2:
        return true; // All fields optional
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, name, slug, businessDescription]);

  // Step navigation
  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    try {
      setIsProcessing(true);

      // Step 1: Create client in database
      await createClient.mutateAsync({
        name,
        slug,
        type,
        language,
        timezone,
        late_profile_id: lateProfileId && lateProfileId !== 'none' ? lateProfileId : undefined,
        // Schedule times (v17.8) - Format-specific posting times
        photo_time: photoTime,
        video_time: videoTime,
        story_time: storyTime,
        feed_time: photoTime, // Legacy: keep for backwards compatibility
        video_ai_captions: videoAiCaptions,
        photo_ai_captions: photoAiCaptions,
      });

      if (!isMountedRef.current) return;

      // Step 2: Create client folder structure
      try {
        await createFolder.mutateAsync(slug);
      } catch (folderError) {
        console.error('Folder creation failed:', folderError);
        // N8: Show warning toast so user knows folder creation failed
        if (isMountedRef.current) {
          toast({
            title: 'Warning',
            description: 'Client folder could not be created. You may need to create it manually.',
            variant: 'destructive',
          });
        }
      }

      if (!isMountedRef.current) return;

      // Step 3: Generate AI config
      const onboarding: OnboardingInput = {
        business_name: name,
        business_description: businessDescription,
        target_audience: targetAudience,
        brand_personality: brandPersonality,
        language,
        content_themes: contentThemes,
        call_to_actions: callToActions,
        things_to_avoid: thingsToAvoid,
      };

      try {
        await generateConfig.mutateAsync({ slug, onboarding });
        if (isMountedRef.current) {
          toast({
            title: 'Client created',
            description: `${name} has been created with AI-generated configuration`,
          });
        }
      } catch (configError) {
        console.error('Config generation failed:', configError);
        if (isMountedRef.current) {
          toast({
            title: 'Client created',
            description: `${name} created. Brand configuration can be generated later.`,
          });
        }
      }

      if (isMountedRef.current) {
        navigate(`/clients/${slug}`);
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create client',
          variant: 'destructive',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  // Manual sync handler
  const handleSync = () => {
    syncAccounts.mutate(undefined, {
      onSuccess: () => {
        if (isMountedRef.current) {
          toast({
            title: 'Accounts synced',
            description: 'Late.com profiles and accounts are up to date',
          });
        }
      },
      onError: (error) => {
        if (isMountedRef.current) {
          toast({
            title: 'Sync failed',
            description: error instanceof Error ? error.message : 'Could not sync accounts',
            variant: 'destructive',
          });
        }
      },
    });
  };

  if (accounts.isLoading) {
    return <LoadingSpinner text="Loading accounts..." />;
  }

  // Get profiles and accounts
  const profiles = accounts.data?.data?.profiles || [];
  const allAccounts = accounts.data?.data?.accounts || [];

  // Filter accounts by selected profile
  const selectedProfileAccounts = useMemo(() => {
    if (!lateProfileId || lateProfileId === 'none') return [];
    return allAccounts.filter(a => a.late_profile_id === lateProfileId);
  }, [lateProfileId, allAccounts]);

  // Get selected profile details
  const selectedProfile = useMemo(() => {
    if (!lateProfileId || lateProfileId === 'none') return null;
    return profiles.find(p => p.id === lateProfileId);
  }, [lateProfileId, profiles]);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="New Client"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: 'New Client' },
        ]}
        actions={
          currentStep === 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillTestData}
              className="gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              Test Data (FR)
            </Button>
          )
        }
      />

      {/* Progress Steps */}
      <div className="relative">
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-colors duration-200
                    ${isComplete ? 'bg-primary text-primary-foreground' : ''}
                    ${isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : ''}
                    ${!isActive && !isComplete ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Enter basic information about your client'}
            {currentStep === 2 && 'Connect Late.com profile and configure settings'}
            {currentStep === 3 && 'Review and create the client'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Client Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Client Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Berlin Bistro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="berlin-bistro"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for folder name and URLs
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="cafe">Café</SelectItem>
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
                      <SelectItem value="America/New_York">America/New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Describe your business in detail. What do you sell? What makes you unique? What's your story?"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This is the most important field. The AI uses this to understand your brand.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Who are your customers? Age range, interests, lifestyle..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personality">Brand Personality</Label>
                  <Textarea
                    id="personality"
                    value={brandPersonality}
                    onChange={(e) => setBrandPersonality(e.target.value)}
                    placeholder="How should your brand sound? Fun, professional, casual, luxurious..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Advanced AI Configuration (collapsible) */}
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                    <span className="text-sm font-medium">Advanced AI Configuration</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="themes">Content Themes</Label>
                    <Textarea
                      id="themes"
                      value={contentThemes}
                      onChange={(e) => setContentThemes(e.target.value)}
                      placeholder="What topics should captions cover? Food photos, behind the scenes, team..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctas">Preferred CTAs</Label>
                    <Textarea
                      id="ctas"
                      value={callToActions}
                      onChange={(e) => setCallToActions(e.target.value)}
                      placeholder="What actions should captions encourage? Visit us, order online, book a table..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avoid">Things to Avoid</Label>
                    <Textarea
                      id="avoid"
                      value={thingsToAvoid}
                      onChange={(e) => setThingsToAvoid(e.target.value)}
                      placeholder="What should captions never mention? Prices, competitors, specific topics..."
                      className="min-h-[60px]"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Step 2: Connect & Configure */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Late.com Profile */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Late.com Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Link a profile to connect all its social accounts
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncAccounts.isPending}
                  >
                    {syncAccounts.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync
                  </Button>
                </div>

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

                {/* Show accounts that will be linked */}
                {selectedProfileAccounts.length > 0 && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-sm font-medium">Accounts that will be linked:</p>
                    <div className="space-y-2">
                      {selectedProfileAccounts.map(acc => (
                        <div key={acc.id} className="flex items-center gap-2 text-sm">
                          <span>{acc.platform === 'instagram' ? '📷' : '🎵'}</span>
                          <span className="font-medium">@{acc.username}</span>
                          <span className="text-muted-foreground">({acc.platform})</span>
                          {acc.health === 'healthy' && (
                            <span className="text-green-500 text-xs">✓ Connected</span>
                          )}
                          {acc.health === 'warning' && (
                            <span className="text-yellow-500 text-xs">⚠ Expiring soon</span>
                          )}
                          {acc.health === 'expired' && (
                            <span className="text-red-500 text-xs">✗ Expired</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profiles.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground border rounded-lg">
                    {syncAccounts.isPending || accounts.isLoading ? (
                      <>
                        <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin opacity-50" />
                        <p className="font-medium">Syncing profiles...</p>
                        <p className="text-sm mt-1">
                          Connecting to Late.com
                        </p>
                      </>
                    ) : (
                      <>
                        <Link2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No profiles available</p>
                        <p className="text-sm mt-1">
                          Click Sync to connect Late.com profiles
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                {/* AI Caption Settings */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Image className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="photoAi"
                          checked={photoAiCaptions}
                          onCheckedChange={(checked) => setPhotoAiCaptions(!!checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="photoAi"
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Generate AI Captions for Photos
                          </label>
                          <p className="text-sm text-muted-foreground">
                            AI will analyze photos and generate captions automatically.
                            When disabled, photos go to review for manual caption entry.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="videoAi"
                          checked={videoAiCaptions}
                          onCheckedChange={(checked) => setVideoAiCaptions(!!checked)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor="videoAi"
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Generate AI Captions for Videos
                          </label>
                          <p className="text-sm text-muted-foreground">
                            AI will analyze video frames and generate captions automatically.
                            When disabled, videos go to review for manual caption entry.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                {/* Posting Schedule (v17.8) - Format-specific times */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-base">Posting Schedule</Label>
                      <p className="text-sm text-muted-foreground">
                        Default times for each content format (24-hour)
                      </p>
                    </div>
                  </div>
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
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
                <h4 className="font-medium text-lg">Summary</h4>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client Name</span>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slug</span>
                    <span className="font-medium">{slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language</span>
                    <span className="font-medium">
                      {language === 'fr' ? 'French' : language === 'en' ? 'English' : 'German'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone</span>
                    <span className="font-medium">{timezone}</span>
                  </div>
                  {selectedProfile && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Late Profile</span>
                      <span className="font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedProfile.color }}
                        />
                        {selectedProfile.name}
                      </span>
                    </div>
                  )}
                  {selectedProfileAccounts.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Linked Accounts</span>
                      <span className="font-medium">{selectedProfileAccounts.length} accounts</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Photo AI Captions</span>
                    <span className="font-medium">{photoAiCaptions ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Video AI Captions</span>
                    <span className="font-medium">{videoAiCaptions ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posting Times</span>
                    <span className="font-medium">Photo {photoTime} / Video {videoTime} / Story {storyTime}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">AI Configuration</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      An AI-powered brand configuration will be generated based on your business description.
                      This includes brand voice, hashtags, and caption prompts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isProcessing}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext} disabled={!canProceed || isProcessing}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Client
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
