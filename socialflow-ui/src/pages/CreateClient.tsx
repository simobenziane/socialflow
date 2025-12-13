import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateClient, useAccounts, useGenerateClientConfig } from '@/hooks';
import { PageHeader, LoadingSpinner } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ChevronDown, ChevronRight, RefreshCw, FileText, Check, FlaskConical } from 'lucide-react';
import type { OnboardingInput, GeneratedConfig } from '@/api/types';

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
    .normalize('NFD')                    // Decompose accented characters (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')     // Remove diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CreateClient() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createClient = useCreateClient();
  const accounts = useAccounts();
  const generateConfig = useGenerateClientConfig();

  // Track component mount state to prevent memory leaks
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Basic info state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('restaurant');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [tiktokAccountId, setTiktokAccountId] = useState('');
  const [feedTime, setFeedTime] = useState('20:00');
  const [storyTime, setStoryTime] = useState('18:30');

  // AI generation state
  const [aiSectionOpen, setAiSectionOpen] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingInput>({
    business_name: '',
    business_description: '',
    target_audience: '',
    brand_personality: '',
    language: 'fr',
    content_themes: '',
    call_to_actions: '',
    things_to_avoid: '',
  });
  const [generatedConfig, setGeneratedConfig] = useState<GeneratedConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
    // Also update onboarding business name
    setOnboarding((prev) => ({ ...prev, business_name: value }));
  };

  const handleFillTestData = () => {
    setName(FRENCH_TEST_DATA.name);
    setSlug(slugify(FRENCH_TEST_DATA.name));
    setType(FRENCH_TEST_DATA.type);
    setLanguage(FRENCH_TEST_DATA.language);
    setTimezone(FRENCH_TEST_DATA.timezone);
    setOnboarding({
      business_name: FRENCH_TEST_DATA.name,
      business_description: FRENCH_TEST_DATA.business_description,
      target_audience: FRENCH_TEST_DATA.target_audience,
      brand_personality: FRENCH_TEST_DATA.brand_personality,
      language: FRENCH_TEST_DATA.language,
      content_themes: FRENCH_TEST_DATA.content_themes,
      call_to_actions: FRENCH_TEST_DATA.call_to_actions,
      things_to_avoid: FRENCH_TEST_DATA.things_to_avoid,
    });
    setAiSectionOpen(true);
    toast({
      title: 'Test data loaded',
      description: 'French bakery/pastry school data has been filled in.',
    });
  };

  const updateOnboarding = (field: keyof OnboardingInput, value: string) => {
    setOnboarding((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateConfig = async () => {
    if (!slug) {
      toast({
        title: 'Slug required',
        description: 'Please enter a client name to generate the slug first.',
        variant: 'destructive',
      });
      return;
    }

    if (!onboarding.business_description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please provide a business description to generate the configuration.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Update onboarding with current language
      const onboardingWithLang = { ...onboarding, language };

      const result = await generateConfig.mutateAsync({
        slug,
        onboarding: onboardingWithLang,
      });

      if (isMountedRef.current) {
        setGeneratedConfig(result.data.config);
        setShowPreview(true);
        toast({
          title: 'Configuration generated',
          description: 'AI has generated the configuration files. Review and edit before saving.',
        });
      }
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate configuration',
        variant: 'destructive',
      });
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createClient.isPending) return;

    if (!name || !slug) {
      toast({
        title: 'Validation error',
        description: 'Name and slug are required',
        variant: 'destructive',
      });
      return;
    }

    // Validate slug format
    const VALID_SLUG = /^[a-z0-9-]+$/;
    if (!VALID_SLUG.test(slug)) {
      toast({
        title: 'Validation error',
        description: 'Slug must contain only lowercase letters, numbers, and hyphens',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Create client in database
      await createClient.mutateAsync({
        name,
        slug,
        type,
        language,
        timezone,
        instagram_account_id: instagramAccountId && instagramAccountId !== 'none' ? instagramAccountId : undefined,
        tiktok_account_id: tiktokAccountId && tiktokAccountId !== 'none' ? tiktokAccountId : undefined,
        feed_time: feedTime,
        story_time: storyTime,
      });

      // Step 2: Generate and write config files if AI config was provided OR create minimal config
      // This ensures client.yaml always exists for W1 ingest to work
      const onboardingWithLang = {
        ...onboarding,
        language,
        business_name: name,
        // Use a default description if none provided
        business_description: onboarding.business_description || `${name} - ${type} business`
      };

      try {
        await generateConfig.mutateAsync({
          slug,
          onboarding: onboardingWithLang,
        });
        toast({
          title: 'Client created',
          description: `Successfully created ${name} with config files`,
        });
      } catch (configError) {
        // Config generation failed, but client was created
        console.error('Config generation failed:', configError);
        toast({
          title: 'Client created (partial)',
          description: `Client ${name} created, but config file generation failed. You may need to generate config manually.`,
          variant: 'default',
        });
      }

      navigate(`/clients/${slug}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create client',
        variant: 'destructive',
      });
    }
  };

  if (accounts.isLoading) {
    return <LoadingSpinner text="Loading accounts..." />;
  }

  const instagramAccounts = accounts.data?.data?.accounts.filter((a) => a.platform === 'instagram') || [];
  const tiktokAccounts = accounts.data?.data?.accounts.filter((a) => a.platform === 'tiktok') || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Create New Client"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Clients', to: '/clients' },
          { label: 'New Client' },
        ]}
        actions={
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
        }
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
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Berlin Döner"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="berlin-doner"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used for folder name and URLs
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
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration Generation */}
        <Collapsible open={aiSectionOpen} onOpenChange={setAiSectionOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">AI Configuration</CardTitle>
                      <CardDescription>
                        Let AI generate briefs, prompts, and hashtags from your business info
                      </CardDescription>
                    </div>
                  </div>
                  {aiSectionOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <Label htmlFor="business_description">Business Description *</Label>
                  <Textarea
                    id="business_description"
                    value={onboarding.business_description}
                    onChange={(e) => updateOnboarding('business_description', e.target.value)}
                    placeholder="Describe your business in detail. What do you sell? What makes you unique? What's your story?"
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the most important field. Be detailed - the AI uses this to understand your brand.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Textarea
                      id="target_audience"
                      value={onboarding.target_audience}
                      onChange={(e) => updateOnboarding('target_audience', e.target.value)}
                      placeholder="Who are your customers? Age range, interests, lifestyle..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_personality">Brand Personality</Label>
                    <Textarea
                      id="brand_personality"
                      value={onboarding.brand_personality}
                      onChange={(e) => updateOnboarding('brand_personality', e.target.value)}
                      placeholder="How should your brand sound? Fun, professional, casual, luxurious..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="content_themes">Content Themes</Label>
                    <Textarea
                      id="content_themes"
                      value={onboarding.content_themes}
                      onChange={(e) => updateOnboarding('content_themes', e.target.value)}
                      placeholder="What topics should captions cover? Food photos, behind the scenes, team..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="call_to_actions">Preferred CTAs</Label>
                    <Textarea
                      id="call_to_actions"
                      value={onboarding.call_to_actions}
                      onChange={(e) => updateOnboarding('call_to_actions', e.target.value)}
                      placeholder="What actions should captions encourage? Visit us, order online, book a table..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="things_to_avoid">Things to Avoid</Label>
                  <Textarea
                    id="things_to_avoid"
                    value={onboarding.things_to_avoid}
                    onChange={(e) => updateOnboarding('things_to_avoid', e.target.value)}
                    placeholder="What should captions never mention? Prices, competitors, specific topics..."
                    className="min-h-[60px]"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateConfig}
                    disabled={isGenerating || !onboarding.business_description.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Configuration
                      </>
                    )}
                  </Button>
                  {generatedConfig && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Configuration generated
                    </span>
                  )}
                </div>

                {/* Generated Config Preview */}
                {showPreview && generatedConfig && (
                  <div className="space-y-4 border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Generated Files Preview
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Edit these before saving if needed
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">brief.txt (Photos & Videos)</Label>
                        <Textarea
                          value={generatedConfig.brief_txt || ''}
                          onChange={(e) =>
                            setGeneratedConfig((prev) =>
                              prev ? { ...prev, brief_txt: e.target.value } : prev
                            )
                          }
                          className="min-h-[150px] font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Single brief used for generating captions for both photos and videos
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">hashtags.txt</Label>
                        <Textarea
                          value={generatedConfig.hashtags_txt || ''}
                          onChange={(e) =>
                            setGeneratedConfig((prev) =>
                              prev ? { ...prev, hashtags_txt: e.target.value } : prev
                            )
                          }
                          className="min-h-[60px] font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">client.yaml (Preview)</Label>
                        <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                          {generatedConfig.client_yaml || 'No YAML generated'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Link Social Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Link Social Accounts</CardTitle>
            <CardDescription>
              Select which Late.com accounts to use for this client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Instagram Account</Label>
              <Select value={instagramAccountId} onValueChange={setInstagramAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Instagram account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {instagramAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      📷 {account.username} - {account.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>TikTok Account</Label>
              <Select value={tiktokAccountId} onValueChange={setTiktokAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select TikTok account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {tiktokAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      🎵 {account.username} - {account.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Posting Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Posting Schedule</CardTitle>
            <CardDescription>
              Default times for scheduled posts (24-hour format)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="feedTime">Feed posts at</Label>
                <Input
                  id="feedTime"
                  type="time"
                  value={feedTime}
                  onChange={(e) => setFeedTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storyTime">Story posts at</Label>
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
          <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createClient.isPending}>
            {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Client
          </Button>
        </div>
      </form>
    </div>
  );
}
