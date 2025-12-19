import { useState, useCallback, useMemo } from 'react';
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
import { FileUploader } from '@/components/onboarding';
import { PageHeader, LoadingSpinner } from '@/components/shared';
import {
  useCreateClient,
  useAccounts,
  useGenerateClientConfig,
  useUploadFiles,
  useCompleteOnboarding,
  useCreateBatch,
} from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Link2,
  Upload,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { OnboardingInput } from '@/api/types';

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const STEPS = [
  { id: 1, name: 'Client Info', icon: User },
  { id: 2, name: 'Connect Accounts', icon: Link2 },
  { id: 3, name: 'Upload Media', icon: Upload },
  { id: 4, name: 'Generate', icon: Sparkles },
];

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // API hooks
  const createClient = useCreateClient();
  const accounts = useAccounts();
  const generateConfig = useGenerateClientConfig();
  const uploadFiles = useUploadFiles();
  const completeOnboarding = useCompleteOnboarding();
  const createBatch = useCreateBatch();

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

  // Step 2: Account Selection
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [tiktokAccountId, setTiktokAccountId] = useState('');

  // Step 3: File Uploads
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);

  // Step 4: Generation Config
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduleStrategy, setScheduleStrategy] = useState<'daily' | 'weekdays' | 'custom'>('daily');

  // Created IDs (stored after creation)
  const [clientId, setClientId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
    if (!batchName) {
      setBatchName(`${value} - First Batch`);
    }
  };

  // File handling
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const filesWithPreview: FileWithPreview[] = newFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.id = `${file.name}-${Date.now()}-${Math.random()}`;
      fileWithPreview.status = 'pending';

      // Create preview for images
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      return fileWithPreview;
    });

    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return name.trim() && slug.trim() && businessDescription.trim();
      case 2:
        return true; // Accounts are optional
      case 3:
        return files.length > 0;
      case 4:
        return batchName.trim() && startDate;
      default:
        return false;
    }
  }, [currentStep, name, slug, businessDescription, files.length, batchName, startDate]);

  // Step navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      // Create client after step 1
      try {
        setIsProcessing(true);
        const result = await createClient.mutateAsync({
          name,
          slug,
          type,
          language,
          timezone,
          instagram_account_id: instagramAccountId && instagramAccountId !== 'none' ? instagramAccountId : undefined,
          tiktok_account_id: tiktokAccountId && tiktokAccountId !== 'none' ? tiktokAccountId : undefined,
        });

        // Get client ID from response (v16: id is now in Client type)
        const createdClientId = result.data.id;
        setClientId(createdClientId);

        // Generate config files
        const onboarding: OnboardingInput = {
          business_name: name,
          business_description: businessDescription,
          target_audience: targetAudience,
          brand_personality: brandPersonality,
          language,
          content_themes: '',
          call_to_actions: '',
          things_to_avoid: '',
        };

        await generateConfig.mutateAsync({ slug, onboarding });

        toast({
          title: 'Client created',
          description: `${name} has been created with AI-generated configuration`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to create client',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }
      setIsProcessing(false);
    }

    if (currentStep === 3 && files.length > 0 && clientId) {
      // Create batch and upload files
      try {
        setIsProcessing(true);

        // Create batch first
        const batchResult = await createBatch.mutateAsync({
          clientId,
          name: batchName || `${name} - Batch`,
          description: batchDescription,
        });

        const createdBatchId = batchResult.data.batch_id;
        setBatchId(createdBatchId);

        // Upload files
        setIsUploading(true);
        const filesToUpload = files.filter((f) => f.status === 'pending');

        await uploadFiles.mutateAsync({
          clientId,
          batchId: createdBatchId,
          files: filesToUpload,
          onProgress: (uploaded, total) => {
            setUploadProgress({ uploaded, total });
            setFiles((prev) =>
              prev.map((f, i) => ({
                ...f,
                status: i < uploaded ? 'success' : i === uploaded ? 'uploading' : f.status,
              }))
            );
          },
        });

        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'success' as const }))
        );

        // Check if any files were uploaded successfully
        const successfulUploads = files.filter((f) => f.status === 'success').length;
        if (successfulUploads === 0) {
          toast({
            title: 'Upload Failed',
            description: 'No files were uploaded successfully. Please try again.',
            variant: 'destructive',
          });
          setIsUploading(false);
          setIsProcessing(false);
          return;
        }

        toast({
          title: 'Files uploaded',
          description: `${successfulUploads} files uploaded successfully`,
        });
      } catch (error) {
        // Check for batch name conflict (409 error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
        if (errorMessage.includes('409') || errorMessage.includes('already exists')) {
          toast({
            title: 'Batch Already Exists',
            description: 'A batch with this name already exists. Please choose a different name.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Upload failed',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        setIsUploading(false);
        setIsProcessing(false);
        return;
      }
      setIsUploading(false);
      setIsProcessing(false);
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!clientId || !batchId) {
      toast({
        title: 'Error',
        description: 'Missing client or batch information',
        variant: 'destructive',
      });
      return;
    }

    // Validate start date is not in the past
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today) {
      toast({
        title: 'Invalid Date',
        description: 'Start date cannot be in the past. Please select today or a future date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const result = await completeOnboarding.mutateAsync({
        client_id: clientId,
        batch_id: batchId,
        batch_name: batchName,
        batch_description: batchDescription,
        start_date: startDate,
        schedule_strategy: scheduleStrategy,
      });

      toast({
        title: 'Onboarding complete!',
        description: `Created ${result.data.content_items_created} content items. AI caption generation will start automatically.`,
      });

      // Navigate to the batch detail page
      navigate(`/batches/${result.data.client_slug}/${result.data.batch_slug}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete onboarding',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (accounts.isLoading) {
    return <LoadingSpinner text="Loading accounts..." />;
  }

  const instagramAccounts = accounts.data?.data?.accounts.filter((a) => a.platform === 'instagram') || [];
  const tiktokAccounts = accounts.data?.data?.accounts.filter((a) => a.platform === 'tiktok') || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="New Client Onboarding"
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'New Client' },
        ]}
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
            {currentStep === 2 && 'Link social media accounts (optional)'}
            {currentStep === 3 && 'Upload photos and videos for this client'}
            {currentStep === 4 && 'Configure scheduling and generate captions'}
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
                  placeholder="Describe your business. What makes it unique? What do you offer?"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This helps the AI understand your brand and write better captions.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Textarea
                    id="audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Who are your customers?"
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personality">Brand Personality</Label>
                  <Textarea
                    id="personality"
                    value={brandPersonality}
                    onChange={(e) => setBrandPersonality(e.target.value)}
                    placeholder="How should your brand sound? Fun, professional, casual..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Connect Accounts */}
          {currentStep === 2 && (
            <div className="space-y-6">
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
                        @{account.username} - {account.display_name}
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
                        @{account.username} - {account.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {instagramAccounts.length === 0 && tiktokAccounts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No accounts connected</p>
                  <p className="text-sm">
                    You can connect accounts later from the Accounts page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Upload Media */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name</Label>
                <Input
                  id="batchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="January Content"
                />
              </div>

              <FileUploader
                onFilesSelected={handleFilesSelected}
                uploadedFiles={files}
                onRemoveFile={handleRemoveFile}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Step 4: Generate */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Ready to Generate</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Client: <span className="text-foreground font-medium">{name}</span></li>
                  <li>Batch: <span className="text-foreground font-medium">{batchName}</span></li>
                  <li>Files: <span className="text-foreground font-medium">{files.length} items</span></li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchDescription">Brief / Description</Label>
                <Textarea
                  id="batchDescription"
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="Optional: Describe this content batch. What theme or occasion is it for?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Schedule Strategy</Label>
                  <Select
                    value={scheduleStrategy}
                    onValueChange={(v) => setScheduleStrategy(v as 'daily' | 'weekdays' | 'custom')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (1 post/day)</SelectItem>
                      <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      <SelectItem value="custom">Custom (configure later)</SelectItem>
                    </SelectContent>
                  </Select>
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

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={!canProceed || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={!canProceed || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Complete & Generate
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
